#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "image.h"

extern "C" {
    #include <jpeglib.h>
    #include <png.h>
}

void abort_(const char * s, ...)
{
    printf("big error: %s\n",s);
    exit(1);
}

Image * jpegfile_to_bytes(char* filename) {
    printf("reading file %s\n",filename);

    struct jpeg_decompress_struct cinfo;
    struct jpeg_error_mgr jerr;
    FILE * infile;		/* source file */
    JSAMPARRAY buffer;		/* Output row buffer */
    int row_stride;		/* physical row width in output buffer */
    //printf("opening\n");
    if ((infile = fopen(filename, "rb")) == NULL) {
        fprintf(stderr, "can't open %s\n", filename);
        return 0;
    }
    //printf("opened\n");
    cinfo.err = jpeg_std_error(&jerr);


    jpeg_create_decompress(&cinfo);
    jpeg_stdio_src(&cinfo, infile);
    (void) jpeg_read_header(&cinfo, TRUE);
    (void) jpeg_start_decompress(&cinfo);

    row_stride = cinfo.output_width * cinfo.output_components;
    //printf("row stride = %d\n",row_stride);
    buffer = (*cinfo.mem->alloc_sarray)
        ((j_common_ptr) &cinfo, JPOOL_IMAGE, row_stride, 1);

    Image* img = (Image*)malloc(sizeof(Image));

    img->w = cinfo.output_width;
    img->h = cinfo.output_height;

    int count = 0;
    int datalen = cinfo.output_height * row_stride;
    img->data= (char*)malloc(sizeof(char)*datalen);

    while (cinfo.output_scanline < cinfo.output_height) {
        (void) jpeg_read_scanlines(&cinfo, buffer, 1);
        memcpy(img->data + count*row_stride, buffer[0], row_stride);
        count++;
    }

    (void) jpeg_finish_decompress(&cinfo);
    jpeg_destroy_decompress(&cinfo);
    fclose(infile);
    return img;
}


Image * pngfile_to_bytes(char* file_name) {
    printf("reading file %s\n",file_name);
    png_structp png_ptr;
    png_infop info_ptr, end_ptr;
    png_uint_32 width, height;
    int bit_depth;
    int color_type;
    int interlace_type;
    png_uint_32 i;

    FILE *fp = fopen(file_name, "rb");
    if (!fp) {
        fprintf(stderr, "can't open %s\n", file_name);
        return 0;
    }


    /* initialize stuff */
    png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if (!png_ptr) abort_("[read_png_file] png_create_read_struct failed");

    info_ptr = png_create_info_struct(png_ptr);
    if (!info_ptr) abort_("[read_png_file] png_create_info_struct failed");

    end_ptr = png_create_info_struct(png_ptr);
    if (!end_ptr) abort_("[read_png_file] png_create_info_struct failed");


    png_init_io(png_ptr, fp);
    png_set_sig_bytes(png_ptr, 0);
    png_read_png(png_ptr, info_ptr, PNG_TRANSFORM_IDENTITY, NULL);

    png_get_IHDR(png_ptr, info_ptr, &width, &height, &bit_depth, &color_type, &interlace_type, NULL, NULL);

    Image* img = (Image*)malloc(sizeof(Image));
    img->w = width;
    img->h = height;
    img->hasAlpha = (color_type == PNG_COLOR_TYPE_RGBA);
    int bytes_per_pixel = 3;
    if(img->hasAlpha) {
        bytes_per_pixel = 4;
    }

    unsigned int row_bytes = png_get_rowbytes(png_ptr, info_ptr);
    img->data = (char*) malloc(row_bytes * height);
    png_bytepp row_pointers = png_get_rows(png_ptr, info_ptr);

    for (i = 0; i < height; i++) {
        memcpy(img->data + row_bytes*i, row_pointers[i], row_bytes);
    }




    png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
    fclose(fp);

    return img;
}
