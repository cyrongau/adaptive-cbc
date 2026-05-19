import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search across all content types' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type: questions, subjects, topics, schools, materials, tutors' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('limit') limit: number = 20,
  ) {
    if (!query || query.trim().length < 2) {
      return { results: [], total: 0 };
    }

    if (type) {
      const results = await this.searchService.searchByType(query.trim(), type, limit);
      return { results, total: results.length };
    }

    return this.searchService.searchAll(query.trim(), limit);
  }
}
