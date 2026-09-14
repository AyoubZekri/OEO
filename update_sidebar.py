import os
import re

file_path = 'src/View/Screen/Saidpar/SaidparController.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Stethoscope to imports
content = content.replace("FileText, Scale, Package, Calendar, FileWarning", "FileText, Scale, Package, Calendar, FileWarning, Stethoscope")

# Add Medical to menu
medical_item = '''        ...(hasAccess(true) ? [{
          name: 'MedicalRecords',
          icon: Stethoscope,
          isDropdown: false,
          label: 'العيادة / الطاقم الطبي',
          route: Approutes.MedicalRecords,
        }] : []),
'''

content = content.replace("        ...(hasAccess(permissions.contracts.view) ? [{", medical_item + "        ...(hasAccess(permissions.contracts.view) ? [{")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
