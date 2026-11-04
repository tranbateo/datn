import re
import codecs

# 1. Update admin.controller.ts
with codecs.open('src/admin/admin.controller.ts', 'r', 'utf8') as f:
    text = f.read()

text = text.replace('import { AdminService } from ''./admin.service'';', '''import { AdminService } from './admin.service';
import { Req } from '@nestjs/common';''')

text = text.replace('async getDashboardStats() {\n    return this.adminService.getDashboardStats();\n  }', '''async getDashboardStats(@Req() req: any) {\n    return this.adminService.getDashboardStats(req.user);\n  }''')

text = text.replace('async getAnalyticsStats() {\n    return this.adminService.getAnalyticsStats();\n  }', '''async getAnalyticsStats(@Req() req: any) {\n    return this.adminService.getAnalyticsStats(req.user);\n  }''')

for method in ['getStudents', 'getTeachers', 'getParents', 'getCourses', 'getQuizzes', 'getNotifications']:
    text = text.replace(f'async {method}() {{\n    return this.adminService.{method}();\n  }}', f'async {method}(@Req() req: any) {{\n    return this.adminService.{method}(req.user);\n  }}')

for method in ['getFeedback', 'getAiModels', 'getSettings']:
    text = text.replace(f'{method}() {{\n    return this.adminService.{method}();\n  }}', f'{method}(@Req() req: any) {{\n    return this.adminService.{method}(req.user);\n  }}')

text = text.replace('async createUser(@Body() dto: CreateUserDto) {\n    return this.adminService.createUser(dto);\n  }', 'async createUser(@Body() dto: CreateUserDto, @Req() req: any) {\n    return this.adminService.createUser(dto, req.user);\n  }')

text = text.replace('async updateUser(@Param(''id'') id: string, @Body() dto: UpdateUserDto) {\n    return this.adminService.updateUser(id, dto);\n  }', 'async updateUser(@Param(''id'') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {\n    return this.adminService.updateUser(id, dto, req.user);\n  }')

text = text.replace('async deleteUser(@Param(''id'') id: string) {\n    return this.adminService.deleteUser(id);\n  }', 'async deleteUser(@Param(''id'') id: string, @Req() req: any) {\n    return this.adminService.deleteUser(id, req.user);\n  }')

text = text.replace('@Roles(Role.ADMIN)', '@Roles(Role.ADMIN, Role.SCHOOL_ADMIN)')

with codecs.open('src/admin/admin.controller.ts', 'w', 'utf8') as f:
    f.write(text)

# 2. Update admin.service.ts
with codecs.open('src/admin/admin.service.ts', 'r', 'utf8') as f:
    text2 = f.read()

# Add interface
text2 = text2.replace('export class AdminService {', '''interface UserContext {
  id: string;
  role: Role;
  schoolId: string | null;
}

@Injectable()
export class AdminService {''')

# Replace methods to accept user and add where clause
def add_user_arg(method_name, body_replace):
    global text2
    text2 = text2.replace(f'async {method_name}() {{', f'async {method_name}(user: UserContext) {{\n    const whereSchool = (user.role !== Role.ADMIN && user.schoolId) ? {{ schoolId: user.schoolId }} : {{}};')

add_user_arg('getDashboardStats', '')
# Add whereSchool to queries in getDashboardStats
text2 = text2.replace('where: { role: Role.STUDENT },', 'where: { role: Role.STUDENT, ...whereSchool },')
text2 = text2.replace('where: { role: Role.TEACHER, isActive: true },', 'where: { role: Role.TEACHER, isActive: true, ...whereSchool },')

add_user_arg('getStudents', '')
text2 = text2.replace('where: { role: Role.STUDENT },', 'where: { role: Role.STUDENT, ...whereSchool },')

add_user_arg('getTeachers', '')
text2 = text2.replace('where: { role: Role.TEACHER },', 'where: { role: Role.TEACHER, ...whereSchool },')

add_user_arg('getParents', '')
text2 = text2.replace('where: { role: Role.PARENT },', 'where: { role: Role.PARENT, ...whereSchool },')

add_user_arg('getCourses', '')
text2 = text2.replace('this.prisma.course.findMany({', 'this.prisma.course.findMany({\n      where: whereSchool,')

add_user_arg('getQuizzes', '')
text2 = text2.replace('this.prisma.quiz.findMany({', 'this.prisma.quiz.findMany({\n      where: whereSchool,')

add_user_arg('getNotifications', '')
add_user_arg('getFeedback', '')
add_user_arg('getAiModels', '')
add_user_arg('getAnalyticsStats', '')

# update create user
text2 = text2.replace('async createUser(dto: CreateUserDto) {', 'async createUser(dto: CreateUserDto, user: UserContext) {')
text2 = text2.replace('avatarUrl: dto.avatarUrl,', 'avatarUrl: dto.avatarUrl,\n        schoolId: (user.role !== Role.ADMIN) ? user.schoolId : undefined,')

# update update user
text2 = text2.replace('async updateUser(id: string, dto: UpdateUserDto) {', 'async updateUser(id: string, dto: UpdateUserDto, user: UserContext) {')
text2 = text2.replace('async deleteUser(id: string) {', 'async deleteUser(id: string, user: UserContext) {')
text2 = text2.replace('getSettings() {', 'getSettings(user: UserContext) {')

with codecs.open('src/admin/admin.service.ts', 'w', 'utf8') as f:
    f.write(text2)

print('Updated admin')
