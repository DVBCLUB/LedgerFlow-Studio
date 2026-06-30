using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace LedgerFlowLauncher
{
    class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string targetExe = Path.Combine(appDir, "release", "win-unpacked", "LedgerFlow Hub.exe");

            if (File.Exists(targetExe))
            {
                // Launch the application using cmd.exe start to run in a clean shell environment,
                // which avoids child process environment issues with Electron's virtual app.asar paths.
                ProcessStartInfo startInfo = new ProcessStartInfo();
                startInfo.FileName = "cmd.exe";
                startInfo.Arguments = "/c start \"\" \"" + targetExe + "\"";
                startInfo.WorkingDirectory = appDir;
                startInfo.UseShellExecute = false;
                startInfo.CreateNoWindow = true;
                Process.Start(startInfo);
                return;
            }

            // If target exe is not found, prompt to auto-pack
            DialogResult result = MessageBox.Show(
                "Không tìm thấy bản cài đặt LedgerFlow Hub Desktop.\n\nBạn có muốn tự động đóng gói (pack) bản desktop mới nhất ngay bây giờ không? Quy trình này sẽ tự động build code mới nhất.",
                "LedgerFlow Hub Launcher",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );

            if (result == DialogResult.Yes)
            {
                // Spawn cmd to package Electron app
                ProcessStartInfo buildInfo = new ProcessStartInfo();
                buildInfo.FileName = "cmd.exe";
                buildInfo.Arguments = "/c npm run desktop:pack";
                buildInfo.WorkingDirectory = appDir;
                buildInfo.UseShellExecute = true;
                buildInfo.WindowStyle = ProcessWindowStyle.Normal;
                
                Process buildProcess = Process.Start(buildInfo);
                buildProcess.WaitForExit();

                if (File.Exists(targetExe))
                {
                    ProcessStartInfo startInfo = new ProcessStartInfo();
                    startInfo.FileName = "cmd.exe";
                    startInfo.Arguments = "/c start \"\" \"" + targetExe + "\"";
                    startInfo.WorkingDirectory = appDir;
                    startInfo.UseShellExecute = false;
                    startInfo.CreateNoWindow = true;
                    Process.Start(startInfo);
                }
                else
                {
                    MessageBox.Show("Đóng gói thất bại. Vui lòng kiểm tra lại log lỗi trong cửa sổ cmd.", "Lỗi Launcher", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }
    }
}
