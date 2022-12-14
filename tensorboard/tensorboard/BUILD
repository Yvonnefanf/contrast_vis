# Description:
# TensorBoard, a dashboard for investigating TensorFlow

load("//tensorboard/defs:web.bzl", "tf_web_library")
load("//tensorboard/defs:zipper.bzl", "tensorboard_zip_file")

package(default_visibility = [":internal"])

licenses(["notice"])

exports_files(["LICENSE"])  # Needed for internal repo.

package_group(
    name = "internal",
    packages = ["//tensorboard/..."],
)


tensorboard_zip_file(
    name = "webfiles",
    deps = [":assets"],
)

tf_web_library(
    name = "assets",
    srcs = [
        "//tensorboard/webapp:index.html",
        "//tensorboard/webapp:index.js",
        "//tensorboard/webapp:svg_bundle",
    ],
    path = "/",
    deps = [
        "//tensorboard/plugins/debugger_v2/tf_debugger_v2_plugin/views/source_code/monaco:monaco_editor",
        "//tensorboard/plugins/debugger_v2/tf_debugger_v2_plugin/views/source_code/monaco:monaco_languages",
        "@com_google_fonts_roboto",
    ],
)

# This is a dummy rule used as a numpy dependency in open-source.
# We expect numpy to already be installed on the system, e.g. via
# `pip install numpy`
py_library(name = "expect_numpy_installed")

# This is a dummy rule used as a futures dependency in open-source.
# We expect futures to already be installed on the system, e.g. via
# `pip install futures`
py_library(name = "expect_futures_installed")

# This is a dummy rule used as a grpc dependency in open-source.
# We expect grpc to already be installed on the system, e.g. via
# `pip install grpcio`
py_library(name = "expect_grpc_installed")

# This is a dummy rule used as a grpc_testing dependency in open-source.
# We expect grpc_testing to already be installed on the system, e.g. via
# `pip install grpcio_testing`
py_library(name = "expect_grpc_testing_installed")

# This is a dummy rule used as a TensorFlow dependency in open-source.
# We expect TensorFlow to already be installed on the system, e.g. via
# `pip install tensorflow`
py_library(name = "expect_tensorflow_installed")

# This is a dummy rule used as a TensorFlow Datasets dependency in open-source.
# We expect TensorFlow Datasets to already be installed on the system, e.g. via
# `pip install tensorflow_datasets`
py_library(name = "expect_tensorflow_datasets_installed")

# This is a dummy rule used as a absl-py dependency in open-source.
# We expect absl-py to already be installed on the system, e.g. via
# `pip install absl-py`
py_library(name = "expect_absl_app_installed")

# This is a dummy rule used as a absl-py dependency in open-source.
# We expect absl-py to already be installed on the system, e.g. via
# `pip install absl-py`
py_library(name = "expect_absl_flags_installed")

# This is a dummy rule used as a absl-py dependency in open-source.
# We expect absl-py to already be installed on the system, e.g. via
# `pip install absl-py`
py_library(name = "expect_absl_flags_argparse_flags_installed")

# This is a dummy rule used as a absl-py dependency in open-source.
# We expect absl-py to already be installed on the system, e.g. via
# `pip install absl-py`
py_library(name = "expect_absl_logging_installed")

# This is a dummy rule used as a absl-py dependency in open-source.
# We expect absl-py to already be installed on the system, e.g. via
# `pip install absl-py`
py_library(name = "expect_absl_testing_absltest_installed")

# This is a dummy rule used as a google_auth dependency in open-source.
# We expect google_auth to already be installed on the system, e.g., via
# `pip install google-auth`.
py_library(name = "expect_google_auth_installed")

# This is a dummy rule used as a google_auth oauthlib_dependency in open-source.
# We expect google_auth_oauthlib to already be installed on the system, e.g., via
# `pip install google-auth-oauthlib`.
py_library(name = "expect_google_auth_oauthlib_installed")

# This is a dummy rule used as a pkg-resources dependency in open-source.
# We expect pkg-resources to already be installed on the system, e.g., via
# `pip install setuptools`.
py_library(name = "expect_pkg_resources_installed")

# This is a dummy rule used as a requests dependency in open-source.
# We expect requests to already be installed on the system, e.g., via
# `pip install requests`.
py_library(name = "expect_requests_installed")

# This is a dummy rule used as a pandas dependency in open-source.
# We expect pandas to already be installed on the system, e.g. via
# `pip install pandas`.
# NOTE: Unlike other parallel dependencies in this file, pandas is an
# optional dependency.
py_library(name = "expect_pandas_installed")

filegroup(
    name = "tf_web_library_default_typings",
    srcs = [
        # Ordering probably matters.
        "@com_microsoft_typescript//:lib.es6.d.ts",
        "@io_angular_clutz//:src/resources/closure.lib.d.ts",
        "//tensorboard/defs:clutz.d.ts",
    ],
    visibility = ["//visibility:public"],
)

py_library(
    name = "data_compat",
    srcs = ["data_compat.py"],
    srcs_version = "PY2AND3",
    deps = [
        "//tensorboard/compat/proto:protos_all_py_pb2",
        "//tensorboard/plugins/audio:metadata",
        "//tensorboard/plugins/histogram:metadata",
        "//tensorboard/plugins/image:metadata",
        "//tensorboard/plugins/scalar:metadata",
        "//tensorboard/util:tensor_util",
        "@com_google_protobuf//:protobuf_python",
    ],
)

py_test(
    name = "data_compat_test",
    size = "small",
    srcs = ["data_compat_test.py"],
    srcs_version = "PY2AND3",
    deps = [
        ":data_compat",
        "//tensorboard:expect_numpy_installed",
        "//tensorboard:expect_tensorflow_installed",
        "//tensorboard/compat/proto:protos_all_py_pb2",
        "//tensorboard/plugins/audio:metadata",
        "//tensorboard/plugins/audio:summary",
        "//tensorboard/plugins/histogram:metadata",
        "//tensorboard/plugins/histogram:summary",
        "//tensorboard/plugins/image:metadata",
        "//tensorboard/plugins/image:summary",
        "//tensorboard/plugins/scalar:metadata",
        "//tensorboard/plugins/scalar:summary",
        "//tensorboard/util:tensor_util",
    ],
)

py_library(
    name = "dataclass_compat",
    srcs = ["dataclass_compat.py"],
    srcs_version = "PY2AND3",
    deps = [
        "//tensorboard/compat/proto:protos_all_py_pb2",
        "//tensorboard/plugins/audio:metadata",
        "//tensorboard/plugins/graph:metadata",
        "//tensorboard/plugins/histogram:metadata",
        "//tensorboard/plugins/hparams:metadata",
        "//tensorboard/plugins/image:metadata",
        "//tensorboard/plugins/pr_curve:metadata",
        "//tensorboard/plugins/scalar:metadata",
        "//tensorboard/plugins/text:metadata",
        "//tensorboard/util:tensor_util",
    ],
)

py_test(
    name = "dataclass_compat_test",
    size = "small",
    srcs = ["dataclass_compat_test.py"],
    srcs_version = "PY2AND3",
    deps = [
        ":dataclass_compat",
        "//tensorboard:expect_numpy_installed",
        "//tensorboard:expect_tensorflow_installed",
        "//tensorboard/backend/event_processing:event_file_loader",
        "//tensorboard/compat/proto:protos_all_py_pb2",
        "//tensorboard/plugins/audio:metadata",
        "//tensorboard/plugins/audio:summary",
        "//tensorboard/plugins/graph:metadata",
        "//tensorboard/plugins/histogram:metadata",
        "//tensorboard/plugins/histogram:summary",
        "//tensorboard/plugins/hparams:metadata",
        "//tensorboard/plugins/hparams:summary_v2",
        "//tensorboard/plugins/pr_curve:metadata",
        "//tensorboard/plugins/pr_curve:summary",
        "//tensorboard/plugins/scalar:metadata",
        "//tensorboard/plugins/scalar:summary",
        "//tensorboard/util:tensor_util",
        "//tensorboard/util:test_util",
    ],
)

py_binary(
    name = "encode_png_benchmark",
    srcs = ["encode_png_benchmark.py"],
    srcs_version = "PY2AND3",
    deps = [
        "//tensorboard:expect_absl_logging_installed",
        "//tensorboard:expect_numpy_installed",
        "//tensorboard:expect_tensorflow_installed",
        "//tensorboard/util:encoder",
        "//tensorboard/util:tb_logging",
        "@org_pythonhosted_six",
    ],
)

py_library(
    name = "plugin_util",
    srcs = ["plugin_util.py"],
    srcs_version = "PY2AND3",
    visibility = ["//visibility:public"],
    deps = [
        ":context",
        "//tensorboard/backend:experiment_id",
        "@org_mozilla_bleach",
        "@org_pythonhosted_markdown",
        "@org_pythonhosted_six",
    ],
)

py_test(
    name = "plugin_util_test",
    size = "small",
    srcs = ["plugin_util_test.py"],
    srcs_version = "PY2AND3",
    tags = ["support_notf"],
    deps = [
        ":context",
        ":plugin_util",
        ":test",
        "//tensorboard/backend:experiment_id",
        "@org_pythonhosted_six",
    ],
)

alias(
    name = "summary",
    actual = "//tensorboard/summary",
    visibility = ["//tensorboard:internal"],
)

py_library(
    name = "lazy",
    srcs = ["lazy.py"],
    srcs_version = "PY2AND3",
)

py_test(
    name = "lazy_test",
    size = "small",
    srcs = ["lazy_test.py"],
    srcs_version = "PY2AND3",
    tags = ["support_notf"],
    deps = [
        ":lazy",
        "@org_pythonhosted_six",
    ],
)
