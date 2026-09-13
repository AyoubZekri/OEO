import os
import re

with open('src/View/Screen/Saidpar/SaidparController.ts', 'rb') as f:
    raw_content = f.read()

# Try to decode from windows-1256 (Arabic) or cp1252
try:
    content = raw_content.decode('cp1256')
except UnicodeDecodeError:
    content = raw_content.decode('cp1252')

content = re.sub(
    r"\.\.\.\(hasAccess\(true\) \? \[\{\s*name: 'Matches',[^\]]*?\}\] : \[\]\),?",
    "",
    content
)

append_str = '''
        ...(hasAccess(true) ? [{
          name: 'Matches',
          icon: Calendar,
          isDropdown: false,
          label: 'المباريات',
          route: Approutes.Matches,
        }] : []),'''

content = re.sub(
    r"(\.\.\.\(hasAccess\(true\) \? \[\{\s*name: 'AbsenceRequests',[^\]]*?\}\] : \[\]\),)",
    r"\g<1>" + append_str,
    content
)

# Restore the correct arabic characters that were garbled
content = content.replace('????????? ????????', 'المخالفات الانضباطية')
content = content.replace('???? ?????', 'إدارة الفِرق')
content = content.replace('? ???????', 'سجل التدريبات')
content = content.replace('??????', 'المعدات')
content = content.replace('????? ??????', 'المعدات الرياضية')
content = content.replace('???? ??????', 'حركة المعدات')

with open('src/View/Screen/Saidpar/SaidparController.ts', 'w', encoding='utf-8') as f:
    f.write(content)
