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
OutputBaseFilename=kyoo-windows
SetupIconFile={#kyoo}\wwwroot\favicon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
AppCopyright=GPL-3.0

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startupShortcut"; Description: "Create shortcut in Startup folder (Starts when you log into Windows)"; GroupDescription: "Start automatically"; Flags: exclusive
Name: "none"; Description: "Do not start automatically"; GroupDescription: "Start automatically"; Flags: exclusive unchecked

[Files]
Source: "{#kyoo}\Kyoo.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#kyoo}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[UninstallDelete]
Type: filesandordirs; Name: "{commonappdata}\Kyoo"

[Icons]
Name: "{autoprograms}\Kyoo"; Filename: "{app}\Kyoo.exe"
Name: "{autodesktop}\Kyoo"; Filename: "{app}\Kyoo.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\Kyoo.exe"; Description: "{cm:LaunchProgram,Kyoo}"; Flags: nowait postinstall skipifsilent