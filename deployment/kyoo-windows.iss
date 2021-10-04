[Setup]
AppId={{31A61284-7939-46BC-B584-D2279A6EEEE8}
AppName=Kyoo
AppVersion=1.0
AppPublisher=SDG
AppPublisherURL=https://github.com/AnonymusRaccoon/Kyoo
AppSupportURL=https://github.com/AnonymusRaccoon/Kyoo
AppUpdatesURL=https://github.com/AnonymusRaccoon/Kyoo
DefaultDirName={commonpf}\Kyoo
DisableProgramGroupPage=yes
LicenseFile={#kyoo}\LICENSE
SetupIconFile={#kyoo}\wwwroot\icon-256x256.png
Compression=lzma
SolidCompression=yes
WizardStyle=modern
AppCopyright=GPL-3.0
ArchitecturesInstallIn64BitMode=x64 arm64 ia64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startupShortcut"; Description: "Create shortcut in Startup folder (Starts when you log into Windows)"; GroupDescription: "Start automatically"; Flags: exclusive
Name: "none"; Description: "Do not start automatically"; GroupDescription: "Start automatically"; Flags: exclusive unchecked

[Files]
Source: "{#kyoo}\Kyoo.Host.Console.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#kyoo}\Kyoo.Host.WindowsTrait.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#kyoo}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Registry]
Root: HKA; Subkey: "Software\SDG"; Flags: uninsdeletekeyifempty
Root: HKA; Subkey: "Software\SDG\Kyoo"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\SDG\Kyoo\Settings"; ValueType: string; ValueName: "DataDir"; ValueData: "{code:GetDataDir}"

[UninstallDelete]
Type: filesandordirs; Name: "{code:GetDataDir}"

[Icons]
Name: "{autoprograms}\Kyoo"; Filename: "{app}\Kyoo.Host.WindowsTrait.exe"
Name: "{autoprograms}\Kyoo (Console)"; Filename: "{app}\Kyoo.Host.Console.exe"
Name: "{autodesktop}\Kyoo"; Filename: "{app}\Kyoo.Host.WindowsTrait.exe"; Tasks: desktopicon
Name: "{autostartup}\Kyoo"; Filename: "{app}\Kyoo.Host.WindowsTrait.exe"; Tasks: startupShortcut

[Run]
Filename: "{app}\Kyoo.Host.WindowsTrait.exe"; Description: "{cm:LaunchProgram,Kyoo}"; Flags: nowait postinstall skipifsilent

[Code]
var
  DataDirPage: TInputDirWizardPage;

procedure InitializeWizard;
begin
  DataDirPage := CreateInputDirPage(wpSelectDir,
    'Choose Data Location', 'Choose the folder in which to install the Kyoo data',
    'The installer will set the following folder for Kyoo. To install in a different folder, click Browse and select another folder.' +
    'Please make sure the folder exists and is accessible. Do not choose the server install folder. Click Next to continue.',
    False, '');
  DataDirPage.Add('');
  DataDirPage.Values[0] := GetPreviousData('DataDir', 'C:\ProgramData\Kyoo');
end;

function GetDataDir(Param: String): String;
begin
  Result := DataDirPage.Values[0];
end;
