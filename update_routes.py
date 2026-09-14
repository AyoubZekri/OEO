import os
import re

file_path = 'src/core/constant/routes.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("};", "  MedicalRecords: '/medical-records',\n};")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
