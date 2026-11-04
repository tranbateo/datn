import os

files = [
    'src/app/[locale]/(auth)/layout.tsx',
    'src/app/[locale]/onboarding/page.tsx',
    'src/app/[locale]/welcome/page.tsx'
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove import
    content = '\n'.join([line for line in content.split('\n') if 'LanguageSwitcher' not in line])
    
    # Remove component
    content = content.replace('<LanguageSwitcher />', '')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('LanguageSwitcher removed from remaining files')
