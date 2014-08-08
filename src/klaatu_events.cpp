#include <semaphore.h>
#include <input/EventHub.h>
#include "klaatu_events.h"

using android::EventHub;
using android::EventHubInterface;
using android::RawEvent;
using android::RawAbsoluteAxisInfo;
using android::INPUT_DEVICE_CLASS_TOUCH_MT;
using android::INPUT_DEVICE_CLASS_TOUCH;
using android::INPUT_DEVICE_CLASS_KEYBOARD;
using android::NO_ERROR;

static int event_thread_stop;
size_t event_indication;
#define EVENT_BUFFER_SIZE 32
#define MAX_POINTS 100
#ifndef ABS_MT_SLOT  /* if not defined in bionic/libc/kernel/common/linux/input.h (2.3) */
#define ABS_MT_SLOT 0x2f
#endif

#ifndef BTN_TOUCH
#define BTN_TOUCH 0x14a
#endif

#ifndef EV_KEY
#define EV_KEY 0x01
#endif

#define CODE_FIELD code

static uint32_t display_w;
static uint32_t display_h;
static pthread_t event_thread_tid;
static RawEvent event_buffer[EVENT_BUFFER_SIZE];
static sem_t event_run_semaphore;
static android::sp<android::EventHub> mHub;
static uint32_t dummy_tracking_id;

//return the current time in msec
static double KgetTime(void) {
    struct timespec res;
    clock_gettime(CLOCK_REALTIME, &res);
    return 1000.0 * res.tv_sec + ((double) res.tv_nsec / 1e6);
}

static void * event_thread(void*arg)
{
    mHub = new EventHub();
    while (!event_thread_stop) {
        event_indication = mHub->getEvents(1000, event_buffer, EVENT_BUFFER_SIZE);
        //printf("doing indi = %d stop = %d\n",event_indication,event_thread_stop);
        if (event_indication) {
            //printf("waiting\n");
            sem_wait(&event_run_semaphore);
        }
    }
    return NULL;
}

static RawAbsoluteAxisInfo touchsensor_axis_x, touchsensor_axis_y;
typedef struct {
    nsecs_t when;
    int32_t x, y, tracking_id, maj, pressure;
    int32_t seen;
    int32_t up;
    int32_t slot;
} POINT_DATA;
static POINT_DATA point_data[MAX_POINTS];
static int point_data_index;
static POINT_DATA *current_point = point_data;
float touch_scaling_x;
float touch_scaling_y;
inline int32_t scalep(int32_t data, RawAbsoluteAxisInfo *axisp, float scaling)
{
    if (data > axisp->maxValue)
        data = axisp->maxValue;
    data -= axisp->minValue;
    if (data < 0)
        data = 0;
    return data * scaling;
}
void event_process(void)
{
    int jcount = 0;
    for (size_t index = 0; index < event_indication; index++ ) {
        RawEvent *p = &event_buffer[index];
        if (p->type == EventHubInterface::DEVICE_ADDED) {
            char *name = ""; //String8  name  = mHub->getDeviceName(p->deviceId);
            uint32_t deviceclass = mHub->getDeviceClasses(p->deviceId);
#if defined(SHORT_PLATFORM_VERSION) && (SHORT_PLATFORM_VERSION == 23)
            if (deviceclass & INPUT_DEVICE_CLASS_TOUCHSCREEN_MT)
#else
            if (deviceclass & INPUT_DEVICE_CLASS_TOUCH_MT)
#endif
                {
                if (mHub->getAbsoluteAxisInfo(p->deviceId, ABS_MT_POSITION_X, &touchsensor_axis_x) != NO_ERROR ||
                    mHub->getAbsoluteAxisInfo(p->deviceId, ABS_MT_POSITION_Y, &touchsensor_axis_y) != NO_ERROR)
                    printf("getAbsoluteAxisInfo failed\n");
                    touch_scaling_x = float(display_w) / float(touchsensor_axis_x.maxValue - touchsensor_axis_x.minValue);
                    touch_scaling_y = float(display_h) / float(touchsensor_axis_y.maxValue - touchsensor_axis_y.minValue);
                    printf("new multi touch: %s\n", name);
            }
            else if (deviceclass & INPUT_DEVICE_CLASS_TOUCH) {
                if (mHub->getAbsoluteAxisInfo(p->deviceId, ABS_X, &touchsensor_axis_x) != NO_ERROR ||
                    mHub->getAbsoluteAxisInfo(p->deviceId, ABS_Y, &touchsensor_axis_y) != NO_ERROR)
                    printf("getAbsoluteAxisInfo failed\n");
                    touch_scaling_x = float(display_w) / float(touchsensor_axis_x.maxValue - touchsensor_axis_x.minValue);
                    touch_scaling_y = float(display_h) / float(touchsensor_axis_y.maxValue - touchsensor_axis_y.minValue);
                    printf("new touch: %s\n", name);
            }
            else if (deviceclass & INPUT_DEVICE_CLASS_KEYBOARD)
                printf("new keyboard: %s\n", name);
        }
        else if (p->type == EventHubInterface::DEVICE_REMOVED) {
            printf("remove device %d\n", p->deviceId);
        }
        else if (p->type == EV_ABS && p->CODE_FIELD == ABS_MT_SLOT) {
            int jj;
            for (jj = 0; jj <= point_data_index; jj++) {
                current_point = &point_data[jj];
                if (current_point->slot == p->value)
                    break;
            }
            if (jj == point_data_index + 1) {
                point_data_index++;
                current_point->slot = p->value;
            }
        }
        else if (p->type == EV_ABS) {
            current_point->seen = 1;
            if (p->CODE_FIELD == ABS_MT_POSITION_X || p->CODE_FIELD == ABS_X)
                current_point->x = scalep(p->value, &touchsensor_axis_x, touch_scaling_x);
            else if (p->CODE_FIELD == ABS_MT_POSITION_Y || p->CODE_FIELD == ABS_Y)
                current_point->y = scalep(p->value, &touchsensor_axis_y, touch_scaling_y);
            else if (p->CODE_FIELD == ABS_MT_TRACKING_ID && p->value == -1) // a release
                current_point->up = 1;
            else if (p->CODE_FIELD == ABS_MT_TRACKING_ID)
                current_point->tracking_id = p->value;
            else if (p->CODE_FIELD == ABS_MT_PRESSURE || ABS_PRESSURE)
                current_point->pressure = p->value;
            else if (p->CODE_FIELD == ABS_MT_TOUCH_MAJOR)
                current_point->maj = p->value;
        }
        else if (p->type == EV_KEY && p->CODE_FIELD == BTN_TOUCH) {
                if (p->value ) {
                    current_point->up = 0; // press event
                    current_point->tracking_id = ++dummy_tracking_id;
                }
                else {
                    current_point->up = 1; // release event
                }
        }
        
        else if (p->type == EV_SYN && p->CODE_FIELD == SYN_REPORT) {
            char pbuf[2000];
            char *pstr = pbuf;
            pbuf[0] = 0;
            int jj;
            for (jj = 0; jj <= point_data_index; jj++) {
                //printf("point up = %d\n",point_data[jj].up);
                if (point_data[jj].up) {
                    sprintf(pstr, " %03d UUUUUUUU", point_data[jj].tracking_id);
                    jcount++;
                    eventSingleton->touchEnd(point_data[jj].x, point_data[jj].y, 1);
                } else if (point_data[jj].seen) {
                    sprintf(pstr, " %03d %03d.%04d", point_data[jj].tracking_id, point_data[jj].x, point_data[jj].y);
                    jcount++;
                    eventSingleton->touchStart(point_data[jj].x, point_data[jj].y, 1, KgetTime());
                    sprintf(pstr, " %03d %03d.%04d\n", point_data[jj].tracking_id, point_data[jj].x, point_data[jj].y);
                    //printf("handling touchpoint %03d\n",point_data[jj].x);
                }
                pstr += strlen(pstr);
                point_data[jj].seen = 0;
            }
            //printf("REPORT %s\n", pbuf);
            jj = 0;
            while(jj <= point_data_index) {
                if (point_data[jj].up) {
                    for (int kk = jj; kk <= point_data_index; kk++)
                        point_data[kk] = point_data[kk+1];
                    if (point_data_index == 0) {
                        current_point = point_data;
                        memset(current_point, 0, sizeof(*current_point));
                    }
                    else
                        point_data_index--;
                }
                else
                    jj++;
            }
        }
        else {
            printf ("OTHER when %lx type %x deviceid %x code %x value %x\n", (unsigned long) p->when, p->type, p->deviceId, p->CODE_FIELD, p->value);
        }
    }
    //printf("processed %d native events\n",jcount);
    event_indication = 0;
    sem_post(&event_run_semaphore);
}


void enable_touch(uint32_t adisplay_w, uint32_t adisplay_h)
{
    display_w = adisplay_w;
    display_h = adisplay_h;
    sem_init(&event_run_semaphore, 0, 0);
    int rc = pthread_create(&event_thread_tid, NULL, event_thread, NULL);
    if (rc != 0) {
        printf ("event_thread creation failed\n");
        exit(-1);
    }
    printf("created the touch thread\n");
}



