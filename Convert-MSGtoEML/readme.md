# 🚀 MSG to EML Converter

Automated PowerShell tool to convert Outlook .msg files to universal .eml format using local Outlook COM objects. Part of the **prafAle Optimization Suite**.

## 📋 Features
- **Batch Processing**: Converts all .msg files in the script directory automatically.
- **Non-Destructive Workflow**: Original files are moved to a backup folder, never deleted.
- **Dependency Awareness**: Checks for Microsoft Outlook installation before execution.
- **Clean Environment**: Keeps your workspace tidy by organizing outputs into timestamped folders.

## ⚙️ Technical Details
- **Status:** Stable
- **Language:** PowerShell
- **Version:** 1.0.0
- **Requirements**: Microsoft Outlook (installed locally)

## 🛠️ Installation & Setup
1. **Download**: Get the `Convert-MSGtoEML.ps1` file.
2. **Location**: Place the script in the same folder where your `.msg` files are located.
3. **Prerequisites**: Ensure Microsoft Outlook is installed on your Windows machine.

## 🚀 How to Use
1. **Execute**: Right-click the script and select **"Run with PowerShell"**.
2. **Elevation**: The script will automatically request Administrator privileges to ensure correct file handling.
3. **Automated Flow**: The tool identifies all `.msg` files and processes them sequentially.

## 📂 Workflow & Results
The tool organizes everything inside a `monkeyjob/` directory:
- **EML Output**: Converted files are saved in `monkeyjob/[timestamp]-eml/`.
- **MSG Backup**: Original files are moved to `monkeyjob/[timestamp]-msg/`.
- **Logging**: Real-time visual feedback is provided in the console (Green for success, Red for errors).

## ⚠️ Error Handling
- **Missing Outlook**: The script stops and notifies you if Outlook is not found.
- **Corrupted Files**: If a file fails to convert, the script logs the error and continues with the next one, providing a final summary of failed items.
