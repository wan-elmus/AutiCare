#include <Arduino.h>
#include "gsr.h"

const int GSR=A0; //
int sensorValue=0; //
int gsr_average=0; //

int readGSR()
{
    long sum=0;
    for(int i=0;i<10;i++)
    {
        sensorValue=analogRead(GSR);
        sum += sensorValue;
        delay(5); 
    }
    gsr_average = sum/10;
    return(gsr_average);
}
