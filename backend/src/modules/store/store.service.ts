import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Product, Cart, CartItem, Order, OrderItem,
  ProductStatus, OrderStatus, PaymentMethod,
} from './entities/store.entity';
import {
  CreateProductDto, UpdateProductDto, AddToCartDto, UpdateCartItemDto, CreateOrderDto, UpdateOrderStatusDto,
} from './dto/store.dto';
import { UserRole } from '../users/entities/user.entity';
import { FinancialService } from '../financial/financial.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { IntegrationType } from '../integrations/entities/integration.entity';

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepo: Repository<CartItem>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    private financialService: FinancialService,
    private integrationsService: IntegrationsService,
  ) {}

  async createProduct(dto: CreateProductDto, userId: string): Promise<Product> {
    const product = this.productRepo.create({
      ...dto,
      originalPrice: dto.originalPrice || null,
      grade: dto.grade || null,
      tags: dto.tags || [],
      images: dto.images || [],
      variants: dto.variants || [],
      createdBy: userId,
    });
    return this.productRepo.save(product);
  }

  async findAllProducts(filters?: { category?: string; productType?: string; grade?: number; search?: string; featured?: boolean; includeAllStatuses?: boolean }): Promise<Product[]> {
    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.creator', 'creator');

    if (!filters?.includeAllStatuses) {
      qb.where('p.status = :status', { status: ProductStatus.PUBLISHED });
    } else {
      qb.where('1 = 1');
    }

    if (filters?.category) qb.andWhere('p.category = :category', { category: filters.category });
    if (filters?.productType) qb.andWhere('p.productType = :productType', { productType: filters.productType });
    if (filters?.grade) qb.andWhere('p.grade = :grade', { grade: filters.grade });
    if (filters?.featured) qb.andWhere('p.isFeatured = true');
    if (filters?.search) {
      qb.andWhere('(p.title ILIKE :search OR p.description ILIKE :search OR p.tags::text ILIKE :search)', { search: `%${filters.search}%` });
    }

    qb.orderBy('p.isFeatured', 'DESC').addOrderBy('p.createdAt', 'DESC');
    return qb.getMany();
  }

  async findMyProducts(userId: string): Promise<Product[]> {
    return this.productRepo.find({
      where: { createdBy: userId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['creator'] });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto, userId: string, userRole: string): Promise<Product> {
    const product = await this.findProductById(id);
    if (product.createdBy !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('You can only edit your own products');
    }
    Object.assign(product, {
      ...dto,
      originalPrice: dto.originalPrice === undefined ? product.originalPrice : dto.originalPrice || null,
      grade: dto.grade === undefined ? product.grade : dto.grade || null,
      tags: dto.tags === undefined ? product.tags : dto.tags || [],
      images: dto.images === undefined ? product.images : dto.images || [],
      variants: dto.variants === undefined ? product.variants : dto.variants || [],
      thumbnailUrl: dto.thumbnailUrl === undefined ? product.thumbnailUrl : dto.thumbnailUrl || null,
    });
    return this.productRepo.save(product);
  }

  async deleteProduct(id: string, userId: string, userRole: string): Promise<void> {
    const product = await this.findProductById(id);
    if (product.createdBy !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('You can only delete your own products');
    }
    await this.productRepo.remove(product);
  }

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId, totalAmount: 0 });
      cart = await this.cartRepo.save(cart);
    }

    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
    const product = await this.findProductById(dto.productId);
    if (product.status !== ProductStatus.PUBLISHED) {
      throw new BadRequestException('Product is not available for purchase');
    }
    if (product.stock <= 0 && product.productType !== 'e_book' && product.productType !== 'course_access') {
      throw new BadRequestException('Product is out of stock');
    }

    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId, totalAmount: 0 });
      cart = await this.cartRepo.save(cart);
    }

    let existingItem = await this.cartItemRepo.findOne({
      where: { cartId: cart.id, productId: dto.productId },
    });

    if (existingItem) {
      existingItem.quantity += dto.quantity || 1;
      await this.cartItemRepo.save(existingItem);
    } else {
      const newItem = this.cartItemRepo.create({
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity || 1,
        unitPrice: Number(product.price),
      });
      await this.cartItemRepo.save(newItem);
    }

    await this.recalculateCartTotal(cart.id);
    return this.getCart(userId);
  }

  async updateCartItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = await this.cartItemRepo.findOne({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');

    item.quantity = dto.quantity;
    await this.cartItemRepo.save(item);
    await this.recalculateCartTotal(cart.id);
    return this.getCart(userId);
  }

  async removeFromCart(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = await this.cartItemRepo.findOne({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');

    await this.cartItemRepo.remove(item);
    await this.recalculateCartTotal(cart.id);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    await this.cartItemRepo.delete({ cartId: cart.id });
    cart.totalAmount = 0;
    await this.cartRepo.save(cart);
    return cart;
  }

  async createOrder(userId: string, dto: CreateOrderDto): Promise<any> {
    const cart = await this.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    const taxAmount = subtotal * 0.16;
    const discountAmount = 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const order = this.orderRepo.create({
      orderNumber,
      userId,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod: dto.paymentMethod || PaymentMethod.M_PESA,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
    });

    const savedOrder = await this.orderRepo.save(order);

    for (const item of cart.items) {
      const orderItem = this.orderItemRepo.create({
        orderId: savedOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.unitPrice) * item.quantity,
      });
      await this.orderItemRepo.save(orderItem);

      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (product && product.productType !== 'e_book' && product.productType !== 'course_access') {
        product.stock = Math.max(0, product.stock - item.quantity);
        await this.productRepo.save(product);
      }
    }

    await this.clearCart(userId);

    const orderWithRelations = await this.orderRepo.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product', 'user'],
    });

    let paymentResult: any = { initiated: false };

    if (order.paymentMethod === PaymentMethod.M_PESA && dto.mpesaPhoneNumber) {
      paymentResult = await this.initiateMpesaPayment(order, dto.mpesaPhoneNumber);
      if (paymentResult.initiated) {
        savedOrder.paymentReference = paymentResult.checkoutRequestId;
        await this.orderRepo.save(savedOrder);
      }
    }

    return {
      ...orderWithRelations,
      payment: paymentResult,
    };
  }

  private async initiateMpesaPayment(
    order: Order,
    phoneNumber: string,
  ): Promise<{ initiated: boolean; checkoutRequestId?: string; message?: string }> {
    try {
      const integration = await this.integrationsService.getIntegrationByType(IntegrationType.MPESA);
      if (!integration || !integration.config) {
        this.logger.warn('M-Pesa integration not configured. Order created without payment.');
        return { initiated: false, message: 'M-Pesa not configured' };
      }

      const config = integration.config as any;
      const baseUrl = config.environment === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke'
        : 'https://api.safaricom.co.ke';

      const authResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')}`,
        },
      });

      const authData = await authResponse.json();
      if (!authResponse.ok) {
        this.logger.error(`M-Pesa auth failed: ${authData.errorDescription}`);
        return { initiated: false, message: 'M-Pesa authentication failed' };
      }

      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64');

      const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: config.shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(Number(order.totalAmount)),
          PartyA: phoneNumber.replace(/[^0-9]/g, ''),
          PartyB: config.shortcode,
          PhoneNumber: phoneNumber.replace(/[^0-9]/g, ''),
          CallBackURL: config.callbackUrl || 'https://your-domain.com/api/v1/integrations/mpesa/callback',
          AccountReference: order.orderNumber,
          TransactionDesc: `Payment for order ${order.orderNumber}`,
        }),
      });

      const stkData = await stkResponse.json();

      if (stkResponse.ok && stkData.ResponseCode === '0') {
        return {
          initiated: true,
          checkoutRequestId: stkData.CheckoutRequestID,
          message: 'M-Pesa STK Push sent. Check your phone and enter PIN.',
        };
      }

      return { initiated: false, message: stkData.errorMessage || 'Failed to initiate M-Pesa payment' };
    } catch (error) {
      this.logger.error(`M-Pesa payment initiation failed: ${error.message}`);
      return { initiated: false, message: 'M-Pesa service unavailable' };
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderById(id: string, userId: string, userRole: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto, userRole: string): Promise<Order> {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only admins can update order status');
    }
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['items', 'items.product', 'user'] });
    if (!order) throw new NotFoundException('Order not found');

    order.status = dto.status;
    if (dto.status === OrderStatus.COMPLETED) {
      order.paidAt = new Date();
      for (const item of order.items) {
        const product = await this.productRepo.findOne({ where: { id: item.productId } });
        if (product) {
          product.salesCount += item.quantity;
          await this.productRepo.save(product);

          if (product.createdBy) {
            await this.financialService.recordSale({
              sellerId: product.createdBy,
              amount: Number(item.unitPrice) * item.quantity,
              orderId: order.id,
              productTitle: product.title,
            });
          }
        }
      }
    }
    return this.orderRepo.save(order);
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  private async recalculateCartTotal(cartId: string): Promise<void> {
    const items = await this.cartItemRepo.find({ where: { cartId } });
    const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    await this.cartRepo.update(cartId, { totalAmount: total });
  }

  async handleMpesaCallback(body: any): Promise<{ ResultCode: number; ResultDesc: string }> {
    this.logger.log('M-Pesa callback received', JSON.stringify(body));

    try {
      const stkCallback = body?.Body?.stkCallback;
      if (!stkCallback) {
        return { ResultCode: 1, ResultDesc: 'Invalid callback body' };
      }

      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

      if (ResultCode === 0) {
        const items = CallbackMetadata?.Item || [];
        const getItem = (name: string) => items.find((i: any) => i.Name === name)?.Value;
        const receiptNumber = getItem('MpesaReceiptNumber');
        const phoneNumber = getItem('PhoneNumber');

        const order = await this.orderRepo.findOne({ where: { paymentReference: CheckoutRequestID } });
        if (order) {
          order.status = OrderStatus.PROCESSING;
          order.paidAt = new Date();
          order.paymentReference = receiptNumber || CheckoutRequestID;
          await this.orderRepo.save(order);
          this.logger.log(`Order ${order.orderNumber} marked as paid. Receipt: ${receiptNumber}`);

          for (const item of order.items || []) {
            const product = await this.productRepo.findOne({ where: { id: item.productId } });
            if (product) {
              product.salesCount += item.quantity;
              await this.productRepo.save(product);
              if (product.createdBy) {
                await this.financialService.recordSale({
                  sellerId: product.createdBy,
                  amount: Number(item.unitPrice) * item.quantity,
                  orderId: order.id,
                  productTitle: product.title,
                });
              }
            }
          }
        } else {
          this.logger.warn(`No order found for checkout request: ${CheckoutRequestID}`);
        }
      } else {
        this.logger.warn(`M-Pesa payment failed: ${ResultDesc}`);
        const order = await this.orderRepo.findOne({ where: { paymentReference: CheckoutRequestID } });
        if (order) {
          order.status = OrderStatus.CANCELLED;
          await this.orderRepo.save(order);
        }
      }
    } catch (error) {
      this.logger.error(`Error handling M-Pesa callback: ${error.message}`);
    }

    return { ResultCode: 0, ResultDesc: 'Success' };
  }

  async getOrderPaymentStatus(id: string, userId: string, userRole: string): Promise<{ status: string; paid: boolean; paidAt?: Date; paymentReference?: string }> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return {
      status: order.status,
      paid: order.status === OrderStatus.PROCESSING || order.status === OrderStatus.COMPLETED,
      paidAt: order.paidAt,
      paymentReference: order.paymentReference,
    };
  }
}
