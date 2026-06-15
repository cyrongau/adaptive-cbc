import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material, MaterialStatus, MaterialVisibility } from './entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialsRepository: Repository<Material>,
  ) {}

  async findAll(params: {
    subjectId?: string;
    grade?: number;
    category?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
    userInstitutionId?: string;
  }): Promise<{ materials: Material[]; total: number; page: number; limit: number }> {
    const { subjectId, grade, category, type, search, page = 1, limit = 20, userInstitutionId } = params;

    const query = this.materialsRepository.createQueryBuilder('m')
      .where('m.status = :status', { status: MaterialStatus.PUBLISHED });

    query.andWhere(
      '(m.visibility = :public OR (m.visibility = :institutionOnly AND m.institutionId = :userInstitutionId))',
      {
        public: MaterialVisibility.PUBLIC,
        institutionOnly: MaterialVisibility.INSTITUTION_ONLY,
        userInstitutionId: userInstitutionId || '',
      },
    );

    if (subjectId) {
      query.andWhere('m.subjectId = :subjectId', { subjectId });
    }

    if (grade) {
      query.andWhere('m.grade = :grade', { grade });
    }

    if (category) {
      query.andWhere('m.category = :category', { category });
    }

    if (type) {
      query.andWhere('m.type = :type', { type });
    }

    if (search) {
      query.andWhere('(m.title ILIKE :search OR m.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const total = await query.getCount();

    query.skip((page - 1) * limit).take(limit)
      .orderBy('m.createdAt', 'DESC');

    const materials = await query.getMany();

    return { materials, total, page, limit };
  }

  async findOne(id: string): Promise<Material> {
    const material = await this.materialsRepository.findOne({
      where: { id },
      relations: ['createdByUser'],
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    material.viewCount += 1;
    await this.materialsRepository.save(material);

    return material;
  }

  async create(
    createDto: CreateMaterialDto,
    userId: string,
    institutionId?: string,
  ): Promise<Material> {
    const material = this.materialsRepository.create({
      ...createDto,
      createdBy: userId,
      institutionId: createDto.visibility === MaterialVisibility.INSTITUTION_ONLY ? institutionId : null,
      status: MaterialStatus.PUBLISHED,
    });

    return this.materialsRepository.save(material);
  }

  async update(id: string, updateDto: UpdateMaterialDto): Promise<Material> {
    const material = await this.findOne(id);
    Object.assign(material, updateDto);
    return this.materialsRepository.save(material);
  }

  async remove(id: string): Promise<void> {
    const material = await this.findOne(id);
    await this.materialsRepository.remove(material);
  }

  async incrementDownloadCount(id: string): Promise<Material> {
    const material = await this.materialsRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
    material.downloadCount += 1;
    return this.materialsRepository.save(material);
  }
}
