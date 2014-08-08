#include "base.h"
#ifndef ABSTRACT_RENDERER
#define ABSTRACT_RENDERER
class AbstractRenderer {
public: 
    virtual void startRender(AminoNode* node);
    AbstractRenderer();
};

#endif
