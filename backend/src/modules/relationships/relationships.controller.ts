import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { RelationshipType } from './entities/relationship.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('relationships')
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Post()
  create(@Body() data: { userId: string; relatedUserId?: string; relationshipType: RelationshipType; relatedUserEmail?: string; relatedUserPhone?: string }) {
    return this.relationshipsService.createRelationship(data);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  invite(@Request() req, @Body() data: { userId?: string; relationshipType: RelationshipType; relatedUserEmail: string; relatedUserPhone?: string }) {
    return this.relationshipsService.resendInvitation({ ...data, userId: req.user.id });
  }

  @Get('user/:userId')
  getUserRelationships(@Param('userId') userId: string, @Query('type') type?: RelationshipType) {
    return this.relationshipsService.getRelationshipsForUser(userId, type);
  }

  @Get('related/:relatedUserId')
  getRelatedRelationships(@Param('relatedUserId') relatedUserId: string, @Query('type') type?: RelationshipType) {
    return this.relationshipsService.getRelationshipsForRelatedUser(relatedUserId, type);
  }

  @Get('parent/:parentUserId/children')
  getChildrenForParent(@Param('parentUserId') parentUserId: string) {
    return this.relationshipsService.getChildrenForParent(parentUserId);
  }

  @Get('student/:studentUserId/parents')
  getParentsForStudent(@Param('studentUserId') studentUserId: string) {
    return this.relationshipsService.getParentsForStudent(studentUserId);
  }

  @Put(':id/verify')
  verify(@Param('id') id: string, @Body() body: { verifiedBy: string; status: string }) {
    return this.relationshipsService.verifyRelationship(id, body.verifiedBy, body.status as any);
  }

  @Put('invitation/:token/accept')
  acceptInvitation(@Param('token') token: string, @Body() body: { parentUserId: string }) {
    return this.relationshipsService.acceptInvitation(token, body.parentUserId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.relationshipsService.removeRelationship(id);
  }
}
