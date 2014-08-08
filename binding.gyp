{
    "targets": [
        {
            "target_name":"aminonative",
            "sources":[
                "src/sg/fonts/vector.c",
                "src/sg/fonts/vertex-buffer.c",
                "src/sg/fonts/vertex-attribute.c",
                "src/sg/fonts/texture-atlas.c",
                "src/sg/fonts/texture-font.c",
                "src/sg/fonts/shader.c",
                "src/sg/fonts/mat4.c",

                "src/sg/base.cc",
                "src/sg/shaders.cpp",
                "src/sg/image.cpp",
                "src/sg/SimpleRenderer.cpp"
            ],
            "include_dirs": [
                "src/sg/",
                "src/sg/fonts/",
            ],

            'conditions': [
                ['OS=="mac"', {
                    "include_dirs": [
                        " <!@(freetype-config --cflags)"
                    ],
                    "libraries": [
                        "-lglfw",
                        "-ljpeg",
                        "-lpng",
                        '-framework OpenGL',
                        '-framework OpenCL',
                        '<!@(freetype-config --libs)'
                    ],
                    "sources": [
                        "src/sg/mac.cpp",
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
                        "src/sg/rpi.cpp",
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
                        "src/sg/mac.cpp",
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
