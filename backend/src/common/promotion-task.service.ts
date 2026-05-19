import { Injectable, Logger } from '@nestjs/common';
import { InstitutionsService } from '../modules/institutions/institutions.service';

@Injectable()
export class PromotionTaskService {
  private readonly logger = new Logger(PromotionTaskService.name);

  constructor(private readonly institutionsService: InstitutionsService) {}

  async triggerPublicStudentPromotion(triggeredBy: string = 'super_admin') {
    this.logger.log('Triggering public student promotion...');

    const result = await this.institutionsService.promotePublicStudents(triggeredBy);
    this.logger.log(
      `Public student promotion completed: ${result.promoted} promoted, ` +
      `${result.graduated} graduated (${result.grade9Graduated} grade 9, ${result.grade12Graduated} grade 12)`,
    );

    return result;
  }
}
