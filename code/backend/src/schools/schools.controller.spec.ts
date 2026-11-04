import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { SchoolsImportService } from './schools-import.service';

describe('SchoolsController', () => {
  let controller: SchoolsController;

  const mockSchoolsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    getLicense: jest.fn(),
    updateByokKey: jest.fn(),
  };

  const mockSchoolsImportService = {
    generateTemplate: jest.fn(),
    previewImport: jest.fn(),
    executeImport: jest.fn(),
    exportCredentials: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolsController],
      providers: [
        { provide: SchoolsService, useValue: mockSchoolsService },
        { provide: SchoolsImportService, useValue: mockSchoolsImportService },
      ],
    }).compile();

    controller = module.get<SchoolsController>(SchoolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
