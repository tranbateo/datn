const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // calculate relative depth
  const parts = filePath.split(path.sep);
  const srcIndex = parts.indexOf('src');
  const depth = parts.length - srcIndex - 2;
  
  let relativePrefix = '';
  if (depth > 0) {
    relativePrefix = '../'.repeat(depth);
  } else {
    relativePrefix = './';
  }

  if (!content.includes('import { PrismaService }')) {
    content = `import { PrismaService } from '${relativePrefix}prisma/prisma.service';\n` + content;
  }

  const providersString = `providers: [
      { provide: PrismaService, useValue: {} },
      { provide: 'JwtService', useValue: {} },
      { provide: 'ConfigService', useValue: {} },
      { provide: 'AuthService', useValue: {} },
      { provide: 'UsersService', useValue: {} },
      { provide: 'NotificationsService', useValue: {} },
      { provide: 'GamificationService', useValue: {} },
      { provide: 'SchedulesService', useValue: {} },
      { provide: 'CalendarService', useValue: {} },
      { provide: 'MessagesService', useValue: {} },
      { provide: 'ProposalsService', useValue: {} },
      { provide: 'AdminService', useValue: {} },
      { provide: 'ParentsService', useValue: {} },
      { provide: 'TeacherService', useValue: {} },
      { provide: 'ChatRagService', useValue: {} },
      { provide: 'CoursesService', useValue: {} }
    ]`;

  if (content.match(/providers: \[\s*([A-Za-z]+)\s*\]/)) {
    // If it has providers with a single service, replace it but keep the service
    content = content.replace(/providers: \[\s*([A-Za-z]+)\s*\]/g, (match, p1) => {
      return providersString.replace('providers: [', `providers: [\n      ${p1},`);
    });
  } else if (!content.includes('providers: [')) {
    // If it has no providers, add it after controllers: [...]
    content = content.replace(/controllers: \[\s*([A-Za-z]+)\s*\]/g, (match) => {
      return `${match},\n      ${providersString}`;
    });
  }
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed', filePath);
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.spec.ts') && !fullPath.includes('app.e2e-spec.ts')) {
      processFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'code', 'backend', 'src'));
