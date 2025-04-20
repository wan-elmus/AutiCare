#ifndef DATA_H  // Header guard
#define DATA_H
#endif

struct SensorData {
  int GSR;          // Galvanic Skin Response (e.g., 16)
  float temperature; // Temperature in °C (e.g., 31.94)
  int IR;           // Infrared value (e.g., 685)
  float BPM;        // Beats Per Minute (e.g., 6.91)
  float avgBPM;     // Average BPM (e.g., 14)
  bool noFinger;    // bool
  double latitide;    // latitude
  double longitude;    // longitude
};

static const char* CSV_HEADER = "Timestamp,GSR,Temperature,IR,BPM,Avg_BPM,No_Finger";