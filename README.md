# download frontend and backend repos
```console
$ cd git_space
# contrast debugger
$ git clone https://github.com/Yvonnefanf/ContrastDebugger.git
# backend and frontend
$ git clone https://github.com/Yvonnefanf/contrast_vis.git
```

### Install bazel 
1. install Bazel for mac： [reference](https://docs.bazel.build/versions/main/install-os-x.html). 

2. install Bazel for windows:[reference](https://docs.bazel.build/versions/main/install-windows.html) <br/>
   
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

#  Requirements to run backend are in ```requirements.txt``` under backend repo. （backend）

conda downloading instruction from [here](https://docs.anaconda.com/anaconda/install/linux/). One simple instruction here:
```console
$ wget https://repo.anaconda.com/miniconda/Miniconda3-py39_4.12.0-Linux-x86_64.sh
$ bash Miniconda3-py39_4.12.0-Linux-x86_64.sh
```

```console
$ conda create -n timevis python=3.7
$ conda activate timevis
$ cd path/to/ContrastDebugger
$ pip install -r requirements.txt
```
User should customize the version of pytorch according to their machine. The default version of pytorch is 1.10.0+cu113. 
```console
$ conda install pytorch torchvision torchaudio cudatoolkit=11.3 -c pytorch
```
Check which pytorch version to select from [here](https://pytorch.org/get-started/locally/)

#  download toy dataset to play with

```console
$ pip install gdown # for downloading large file from google drive
$ cd path/to/data_folder
$ gdown https://drive.google.com/u/1/uc?id=1vpavoxajCMr5bLNs5SmXV__pL4i37b6d
$ unzip toy_model.zip
$ rm toy_model.zip # (optional)in case low drive storage
$ cd resnet18_cifar10
$ sh run.sh
```
You can specify which gpu to use in config.py. If none, set ```"GPU"=None```. The default is ```"GPU"="0"```

# start

1. start backend
```console
$(base) conda activate timevis
$(timevis) cd training-visualization-frontend/server
$(timevis) python server.py
```
2. start frontend
> no need of specified environment
```console
$(timevis) cd training-visualization-frontend/tensorboard
$(timevis) bazel run tensorboard/plugins/projector/vz_projector:standalone
```
3. Open `http://localhost:6006/standalone.html`.  
  （windows sometimes may use 6007）
> *Noted that https will report error, replace with http*

