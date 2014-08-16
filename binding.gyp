{
    "targets": [
        {
            "target_name":"aminonative",
            "sources":[
                "src/base.cc",
                "src/fonts/vector.c",
                "src/fonts/vertex-buffer.c",
                "src/fonts/vertex-attribute.c",
                "src/fonts/texture-atlas.c",
                "src/fonts/texture-font.c",
                "src/fonts/shader.c",
                "src/fonts/mat4.c",

                "src/shaders.cpp",
                "src/image.cpp",
                "src/SimpleRenderer.cpp"
            ],
            "include_dirs": [
                "src/",
                "src/fonts/",
            ],

            'conditions': [
                ['OS=="mac"', {
                    "include_dirs": [
                        " <!@(freetype-config --cflags)",
                        " <!@(pkg-config --cflags libglfw)",
                        "/usr/local/Cellar/jpeg/8d/include/",
                        " <!@(pkg-config --cflags libpng)"
                    ],
                    "libraries": [
                        " <!@(pkg-config --libs libglfw)",
                        "-L/usr/local/Cellar/jpeg/8d/lib",
                        "-lpng",
                        '-framework OpenGL',
                        '-framework OpenCL',
                        '-framework IOKit',
                        '<!@(freetype-config --libs)'
                    ],
                    "sources": [
                        "src/mac.cpp",
                    ],
                    "defines": [
                        "MAC",
                        "GLFW_NO_GLU",
                        "GLFW_INCLUDE_GL3",
                    ]
                }],

                ['OS=="klaatu"', {
                    "defines": [
                        "KLAATU"
                    ]
                }],
                ['OS=="raspberrypi"', {
                    "sources": [
                        "src/rpi.cpp",
                    ],
                    "libraries":[
                        "-lpng",
                        "-ljpeg",
                        "-L/opt/vc/lib/ -lbcm_host",
                        "-lGLESv2",
                        "-lEGL",
                        '<!@(freetype-config --libs)',
                    ],
                    "defines": [
                        "RPI"
                    ],
                    "include_dirs": [
                        "/opt/vc/include/",
                        "/usr/include/freetype2",
                        "/opt/vc/include/interface/vcos/pthreads",
                        "/opt/vc/include/interface/vmcs_host/linux",
                        '<!@(freetype-config --cflags)'
                    ],
                }],

                ['OS=="linux"', {
                    "libraries":[
                        '<!@(freetype-config --libs)',
                        "-lglfw",
                        "-lpng",
                        "-ljpeg"
                    ],
                    "sources": [
                        "src/mac.cpp",
                    ],
                    "defines": [
                        "GL_GLEXT_PROTOTYPES",
                        "LINUX"
                    ],
                    "include_dirs": [
                        "/usr/include/freetype2",
                        '<!@(freetype-config --cflags)'
                    ],
                }]
            ]

        }
    ]
}
