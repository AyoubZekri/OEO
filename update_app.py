import os
import re

file_path = 'src/App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace(
    "import { Matches } from './View/Screen/Matches/Matches';",
    "import { Matches } from './View/Screen/Matches/Matches';\nimport { Medical } from './View/Screen/Medical/Medical';"
)

# Add route
content = content.replace(
    "<Route path={Approutes.Matches} element={<Matches />} />",
    "<Route path={Approutes.Matches} element={<Matches />} />\n            <Route path={Approutes.MedicalRecords} element={<Medical />} />"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
