import os
import re

file_path = 'src/View/Screen/Matches/MatchesController.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
content = content.replace(
    "const [selectedMatchForViewCallups, setSelectedMatchForViewCallups] = useState<Match | null>(null);",
    "const [selectedMatchForViewCallups, setSelectedMatchForViewCallups] = useState<Match | null>(null);\n  const [isAdministrativeReportDialogOpen, setIsAdministrativeReportDialogOpen] = useState(false);\n  const [selectedMatchForAdministrativeReport, setSelectedMatchForAdministrativeReport] = useState<Match | null>(null);"
)

# Add functions
functions = '''  const closeViewCallupsDialog = () => {
    setIsViewCallupsDialogOpen(false);
    setSelectedMatchForViewCallups(null);
  };

  const openAdministrativeReportDialog = (match: Match) => {
    setSelectedMatchForAdministrativeReport(match);
    setIsAdministrativeReportDialogOpen(true);
  };

  const closeAdministrativeReportDialog = () => {
    setIsAdministrativeReportDialogOpen(false);
    setSelectedMatchForAdministrativeReport(null);
  };'''

content = content.replace(
    "  const closeViewCallupsDialog = () => {\n    setIsViewCallupsDialogOpen(false);\n    setSelectedMatchForViewCallups(null);\n  };",
    functions
)

# Add to return
returns_match = re.search(r'return \{([\s\S]*?)\};', content)
if returns_match:
    old_returns = returns_match.group(1)
    new_returns = old_returns + ",\n    isAdministrativeReportDialogOpen,\n    selectedMatchForAdministrativeReport,\n    openAdministrativeReportDialog,\n    closeAdministrativeReportDialog"
    content = content.replace(old_returns, new_returns)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
