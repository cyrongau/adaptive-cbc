import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MinioService } from '../../common/minio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StoreService } from './store.service';
import {
  CreateProductDto, UpdateProductDto, AddToCartDto, UpdateCartItemDto, CreateOrderDto, UpdateOrderStatusDto,
} from './dto/store.dto';

@ApiTags('store')
@Controller('store')
@ApiBearerAuth('JWT-auth')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly minioService: MinioService,
  ) {}

  @Get('products')
  @ApiOperation({ summary: 'List all published products' })
  async getProducts(
    @Query('category') category?: string,
    @Query('productType') productType?: string,
    @Query('grade') grade?: number,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
  ) {
    return this.storeService.findAllProducts({
      category,
      productType,
      grade,
      search,
      featured: featured === 'true',
    });
  }

  @Get('products/my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List my products' })
  async getMyProducts(@Request() req) {
    return this.storeService.findMyProducts(req.user.id);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  async getProduct(@Param('id') id: string) {
    return this.storeService.findProductById(id);
  }

  @Post('products/upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: undefined, // use memoryStorage (multer default when storage omitted)
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({ summary: 'Upload a product thumbnail image to MinIO' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  async uploadProductImage(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided');
    const ext = extname(file.originalname).toLowerCase();
    const { url } = await this.minioService.uploadFile(
      'products',
      `${uuidv4()}${ext}`,
      file.buffer,
      file.mimetype,
    );
    return { imageUrl: url, message: 'Image uploaded successfully' };
  }

  @Post('products')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a product' })
  async createProduct(@Body() dto: CreateProductDto, @Request() req) {
    return this.storeService.createProduct(dto, req.user.id);
  }

  @Put('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a product' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req) {
    return this.storeService.updateProduct(id, dto, req.user.id, req.user.role);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a product' })
  async deleteProduct(@Param('id') id: string, @Request() req) {
    return this.storeService.deleteProduct(id, req.user.id, req.user.role);
  }

  @Get('cart')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user cart' })
  async getCart(@Request() req) {
    return this.storeService.getCart(req.user.id);
  }

  @Post('cart/add')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(@Body() dto: AddToCartDto, @Request() req) {
    return this.storeService.addToCart(req.user.id, dto);
  }

  @Put('cart/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateCartItem(@Param('itemId') itemId: string, @Body() dto: UpdateCartItemDto, @Request() req) {
    return this.storeService.updateCartItem(req.user.id, itemId, dto);
  }

  @Delete('cart/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeFromCart(@Param('itemId') itemId: string, @Request() req) {
    return this.storeService.removeFromCart(req.user.id, itemId);
  }

  @Delete('cart')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Clear cart' })
  async clearCart(@Request() req) {
    return this.storeService.clearCart(req.user.id);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create order from cart' })
  async createOrder(@Body() dto: CreateOrderDto, @Request() req) {
    return this.storeService.createOrder(req.user.id, dto);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user orders' })
  async getOrders(@Request() req) {
    return this.storeService.getUserOrders(req.user.id);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrder(@Param('id') id: string, @Request() req) {
    return this.storeService.getOrderById(id, req.user.id, req.user.role);
  }

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get all orders (admin only)' })
  async getAllOrders() {
    return this.storeService.getAllOrders();
  }

  @Put('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Update order status (admin only)' })
  async updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @Request() req) {
    return this.storeService.updateOrderStatus(id, dto, req.user.role);
  }
}
