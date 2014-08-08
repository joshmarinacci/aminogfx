#include <math.h>
#include <time.h>
#include <stdio.h>
#include <string.h>

//these should probably move into the NodeStage class or a GraphicsUtils class
#define ASSERT_EQ(A, B) {if ((A) != (B)) {printf ("ERROR: %d\n", __LINE__); exit(9); }}
#define ASSERT_NE(A, B) {if ((A) == (B)) {printf ("ERROR: %d\n", __LINE__); exit(9); }}
#define EXPECT_TRUE(A) {if ((A) == 0) {printf ("ERROR: %d\n", __LINE__); exit(9); }}

static void clear(GLfloat *m) {
    int i;
    for (i = 0; i < 16; i++)
        m[i] = 0.0;
}

static void
make_y_rot_matrix(GLfloat angle, GLfloat *m) {
    float c = cos(angle * M_PI / 180.0);
    float s = sin(angle * M_PI / 180.0);
    int i;
    for (i = 0; i < 16; i++)
        m[i] = 0.0;
    //identity values
    m[0] = m[5] = m[10] = m[15] = 1.0;
    
    m[0]=c;
    m[2]=-s;
    m[8]=s;
    m[10]=c;
}

static void
make_z_rot_matrix(GLfloat angle, GLfloat *m)
{
   float c = cos(angle * M_PI / 180.0);
   float s = sin(angle * M_PI / 180.0);
   int i;
   for (i = 0; i < 16; i++)
      m[i] = 0.0;
   m[0] = m[5] = m[10] = m[15] = 1.0;

   m[0] = c;
   m[1] = s;
   m[4] = -s;
   m[5] = c;
}

static void
make_x_rot_matrix(GLfloat angle, GLfloat *m)
{
   float c = cos(angle * M_PI / 180.0);
   float s = sin(angle * M_PI / 180.0);
   int i;
   for (i = 0; i < 16; i++)
      m[i] = 0.0;
   m[0] = m[5] = m[10] = m[15] = 1.0;

   m[5] = c;
   m[6] = s;
   m[9] = -s;
   m[10] = c;
}

static void
print_matrix(GLfloat *m) {
    printf("matrix ");
    for(int i=0; i<16; i++) {
        printf("%.1f  ",m[i]);
        if(i%4==3) printf(", ");
    }
    printf("\n");
}

static void
make_identity_matrix(GLfloat *m) {
   int i;
   for (i = 0; i < 16; i++)
      m[i] = 0.0;
    m[0] = 1;
    m[5] = 1;
    m[10] = 1;
    m[15] = 1;
}

static void
make_scale_matrix(GLfloat xs, GLfloat ys, GLfloat zs, GLfloat *m)
{
    make_identity_matrix(m);
   m[0] = xs;
   m[5] = ys;
   m[10] = zs;
   m[15] = 1.0;
}


static void 
make_trans_matrix(GLfloat x, GLfloat y, GLfloat z, GLfloat *m)
{
    make_identity_matrix(m);
    m[12] = x;
    m[13] = y;
    m[14] = z;
}

static void 
make_trans_z_matrix(GLfloat z, GLfloat *m)
{
    make_identity_matrix(m);
    m[14] = z;
}

static void
mul_matrix(GLfloat *prod, const GLfloat *a, const GLfloat *b)
{
#define A(row,col)  a[(col<<2)+row]
#define B(row,col)  b[(col<<2)+row]
#define P(row,col)  p[(col<<2)+row]
   GLfloat p[16];
   GLint i;
   for (i = 0; i < 4; i++) {
      const GLfloat ai0=A(i,0),  ai1=A(i,1),  ai2=A(i,2),  ai3=A(i,3);
      P(i,0) = ai0 * B(0,0) + ai1 * B(1,0) + ai2 * B(2,0) + ai3 * B(3,0);
      P(i,1) = ai0 * B(0,1) + ai1 * B(1,1) + ai2 * B(2,1) + ai3 * B(3,1);
      P(i,2) = ai0 * B(0,2) + ai1 * B(1,2) + ai2 * B(2,2) + ai3 * B(3,2);
      P(i,3) = ai0 * B(0,3) + ai1 * B(1,3) + ai2 * B(2,3) + ai3 * B(3,3);
   }
   memcpy(prod, p, sizeof(p));
#undef A
#undef B
#undef PROD
}

static void 
loadOrthoMatrix(GLfloat *modelView,  GLfloat left, GLfloat right, GLfloat bottom, GLfloat top, GLfloat near, GLfloat far) {
            GLfloat r_l = right - left;
            GLfloat t_b = top - bottom;
            GLfloat f_n = far - near;
            GLfloat tx = - (right + left) / (right - left);
            GLfloat ty = - (top + bottom) / (top - bottom);
            GLfloat tz = - (far + near) / (far - near);
            
            modelView[0] = 2.0f / r_l;
            modelView[1] = 0.0f;
            modelView[2] = 0.0f;
            modelView[3] = tx;
        
            modelView[4] = 0.0f;
            modelView[5] = 2.0f / t_b;
            modelView[6] = 0.0f;
            modelView[7] = ty;
        
            modelView[8] = 0.0f;
            modelView[9] = 0.0f;
            modelView[10] = 2.0f / f_n;
            modelView[11] = tz;
        
            modelView[12] = 0.0f;
            modelView[13] = 0.0f;
            modelView[14] = 0.0f;
            modelView[15] = 1.0f;
    }
static void
copy_matrix(GLfloat *dst, GLfloat *src) {
    for(int i=0; i<16; i++) {
        dst[i] = src[i];
    }
}
static void
loadPerspectiveMatrix(GLfloat *m, GLfloat fov, GLfloat aspect, GLfloat znear, GLfloat zfar) {
    float PI_OVER_360 = M_PI/180.0;
    float ymax = znear*tan(fov*PI_OVER_360);
    float ymin = -ymax;
    float xmax = ymax*aspect;
    float xmin = ymin*aspect;
    
    float width = xmax-xmin;
    float height = ymax - ymin;
    
    float depth = zfar-znear;
    float q = -(zfar+znear)/depth;
    float qn = -2*(zfar*znear)/depth;
    
    float w = 2*znear/width;
    //w = w/aspect;
    float h = 2*znear/height;
    
    m[0] = w;
    m[1] = 0;
    m[2] = 0;
    m[3] = 0;
    
    m[4] = 0;
    m[5] = h;
    m[6] = 0;
    m[7] = 0;
    
    m[8] = (xmax+xmin)/(xmax-xmin);
    m[9] = (ymax+ymin)/(ymax-ymin);
    m[10]= q;
    m[11]= -1;

    m[12]= 0;
    m[13]= 0;
    m[14]= qn;
    m[15]= 0;
}



static void
loadPixelPerfect(GLfloat *m, float width, float height, float z_eye, float z_near, float z_far) {
//    printf("pixel perfect: %f %f %f %f %f\n",width,height,z_eye,z_near,z_far);
    float kdn = z_eye - z_near;
    float kdf = z_eye - z_far;
    float ksz = - (kdf+kdn)/(kdf-kdn);
    float ktz = - (2.0f*kdn*kdf)/(kdf-kdn);
    
    m[0]=(2.0f*z_eye)/width; m[1]=0;                    m[2]=0; m[3]=0;
    m[4]=0;                  m[5]=(2.0f*z_eye)/height;  m[6]=0; m[7]=0;
    m[8]=0; m[9]=0; m[10]=ktz-ksz*z_eye; m[11]=-1.0f;
    m[12]=0; m[13]=0; m[14]=ksz; m[15]=z_eye;
}

static void
transpose(GLfloat *b, GLfloat *a) {
    //0,1,2,3
    //4,5,6,7
    //8,9,10,11
    //12,13,14,15
    
    for(int i=0; i<4; i++) {
        for(int j=0; j<4; j++) {
            b[i*4+j] = a[j*4+i];
        }
    }
}
