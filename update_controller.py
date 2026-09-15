import os
import re

file_path = 'src/View/Screen/Members/MembersController.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
states = '''  const [isClearanceDialogOpen, setIsClearanceDialogOpen] = useState(false);
  const [selectedMemberForClearance, setSelectedMemberForClearance] = useState<any>(null);'''

content = content.replace("const [selectedMemberForAction, setSelectedMemberForAction] = useState<any>(null);", "const [selectedMemberForAction, setSelectedMemberForAction] = useState<any>(null);\n" + states)

# Add functions
functions = '''  const openClearanceDialog = (member: any) => {
    setSelectedMemberForClearance(member);
    setIsClearanceDialogOpen(true);
  };
  const closeClearanceDialog = () => {
    setIsClearanceDialogOpen(false);
    setSelectedMemberForClearance(null);
  };'''

content = content.replace("const handleFilterChange = (key: string, value: string) => {", functions + "\n\n  const handleFilterChange = (key: string, value: string) => {")

# Add to return
returns = '''    isClearanceDialogOpen,
    selectedMemberForClearance,
    openClearanceDialog,
    closeClearanceDialog,'''

content = content.replace("openActionDialog,", "openActionDialog,\n" + returns)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
