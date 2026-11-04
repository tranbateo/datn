import os

files = [
    'src/components/admin/AdminHeader.tsx',
    'src/components/dashboard/StudentNavigation.tsx',
    'src/components/layout/Navbar.tsx',
    'src/components/parent/ParentNavigation.tsx',
    'src/components/teacher/TeacherHeader.tsx'
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove import
    content = '\n'.join([line for line in content.split('\n') if 'import { LanguageSwitcher }' not in line])
    
    # Remove component
    content = content.replace('<LanguageSwitcher />', '')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('LanguageSwitcher removed')
