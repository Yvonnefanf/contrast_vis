### install bazel 

### backend
```
cd server
python server.py
```

### frontend
```
cd tensorboard
bazel run tensorboard/plugins/projector/vz_projector:standalone
```
Open http://localhost:6006/standalone.html
