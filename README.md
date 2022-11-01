### Install bazel 
1. install Bazel for mac： [reference](https://docs.bazel.build/versions/main/install-os-x.html). 

2. install Bazel for windows:[reference](https://docs.bazel.build/versions/main/install-windows.html) <br/>
   (1)[Install the prerequisites](https://www.microsoft.com/en-us/download/details.aspx?id=48145) (If it prompts that other versions have been installed during the installation process, there is no need to repeat the installation)<br/>
   (2)download the Bazel binary: [releases](https://github.com/bazelbuild/bazel/releases) | [bazel-3.2.0-windows-x86_64.exe](https://github.com/bazelbuild/bazel/releases/download/3.2.0/bazel-3.2.0-windows-x86_64.exe)<br/>
   (3) Installing compilers: download: [MSYS2 x86_64](https://www.msys2.org/)<br/>
       MSYS2 is a software distro and building platform for Windows. It contains Bash and common Unix tools (like grep, tar, 
       git).(In fact, it is to create a linux-like environment for bazel under windows.)
      [why MSYS2](https://docs.bazel.build/versions/main/install-windows.html)

      You will likely need these to build and run targets that depend on Bash. MSYS2 does not install these tools by default, so 
      you need to install them manually. Projects that depend on Bash tools in PATH need this step (for example TensorFlow).
      Open the MSYS2 terminal and run this command:
      ```console
      pacman -S zip unzip patch diffutils git
      ```
      Optional: If you want to use Bazel from CMD or Powershell and still be able to use Bash tools, make sure to add 
      <MSYS2_INSTALL_PATH>/usr/bin to your PATH environment variable.
      
  (4) add environment variable: <br/>
      BAZEL_SH =C:\msys64\usr\bin\bash.exe<br/>
      Rename the previously downloaded bazel-3.2.0-windows-x86_64.exe to bazel.exe and put it in C:\msys64
      Administrator runs cmd to verify   
```console
> bazel version
```
3. install Bazel for linux

example: ubuntu
```console
$ sudo apt install apt-transport-https curl gnupg
$ curl -fsSL https://bazel.build/bazel-release.pub.gpg | gpg --dearmor > bazel.gpg
$ sudo mv bazel.gpg /etc/apt/trusted.gpg.d/
$ echo "deb [arch=amd64] https://storage.googleapis.com/bazel-apt stable jdk1.8" | sudo tee /etc/apt/sources.list.d/bazel.list
$ sudo apt update && sudo apt install bazel
```
to specify the version of bazel use ```sudo apt install bazel-5.2.0```. 

check whether installation successful
```console
$ bazel --version
```

### Backend
```
cd server
python server.py
```

### Frontend
```
cd tensorboard
bazel run tensorboard/plugins/projector/vz_projector:standalone
```
Open http://localhost:6006/standalone.html
