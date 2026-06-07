import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  async createTicket(@Request() req, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(req.user.id, dto);
  }

  @Get('tickets')
  async getTickets(@Request() req) {
    const roles = ['super_admin', 'institution_admin', 'tutor'];
    if (roles.includes(req.user.role)) {
      return this.supportService.getAllTickets(req.user.role);
    }
    return this.supportService.getUserTickets(req.user.id);
  }

  @Get('tickets/:id')
  async getTicketById(@Request() req, @Param('id') id: string) {
    return this.supportService.getTicketById(id, req.user.id, req.user.role);
  }

  @Put('tickets/:id')
  async updateTicket(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.supportService.updateTicket(id, req.user.id, req.user.role, dto);
  }
}
