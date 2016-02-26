/* Start of Arduino sketch */

#include <Servo.h>

int pin;
byte value;
int device;
Servo srv;
int ipins[14];
int iapins[6];

void pciSetup(byte pin)
{
    *digitalPinToPCMSK(pin) |= bit (digitalPinToPCMSKbit(pin));  // enable pin
    PCIFR  |= bit (digitalPinToPCICRbit(pin)); // clear any outstanding interrupt
    PCICR  |= bit (digitalPinToPCICRbit(pin)); // enable interrupt for the group
}

ISR (PCINT0_vect) // handle pin change interrupt for D8 to D13 here
 {  
	int i;  
     //digitalWrite(13,digitalRead(8) and digitalRead(9));
	for (i=8; i<=13; i++) {
		if (ipins[i] == 1) {
			Serial.write(i);
			Serial.write(digitalRead(i));
		}
	}
 }
 
ISR (PCINT1_vect) // handle pin change interrupt for A0 to A5 here
 {
 	int val;
	int i;  

	for (i=0; i<6; i++) {
		if (iapins[i] == 1) {
			Serial.write(50+i);
			Serial.write(analogRead(A0 + i));
		}
	}
 }  
 
ISR (PCINT2_vect) // handle pin change interrupt for D0 to D7 here
 {
     int i;  

	for (i=0; i<8; i++) {
		if (ipins[i] == 1) {
			Serial.write(i);
			Serial.write(digitalRead(i));
		}
	}
 }  

void setup() {
  int i;
  for (i=0; i<=13; i++) {
    ipins[i] = 0;
  }
  for (i=0; i<=5; i++) {
    iapins[i] = 0;
  }
  // put your setup code here, to run once:
  Serial.begin(115200);
  //srv.attach(52); // hard code servo to this pin
}
// Incoming protocol: pin value device
// supported devices
// 4: analog port (for example PWM led)
// 3: digital port (LOW/HIGH, not implemented yet)
// 5: servo (0-180)
void loop() {
	int i;

	if (Serial.available() > 0) {
		while(Serial.available() < 3);
		pin = Serial.read();
		value = Serial.read();
		device = Serial.read();

		if (pin < 50) {
			if (device == 1) {
				if (value == 1) {
					ipins[pin] = 1;
					pinMode(pin, INPUT);
					pciSetup(pin);
				} else {
					ipins[pin] = 0;
					pinMode(pin, OUTPUT);
				}
			} else if (device == 4) {
			  analogWrite(pin, value);//output received byte
			} else if (device == 3) {
			  if (value == 0) {
				digitalWrite(pin, LOW);
			  } else {
				digitalWrite(pin, HIGH);
			  }
			 // srv.write(value);
			 // delay(15);
			}
		} else {
			if (device == 1) {
				iapins[pin-50] = value;
			}
		}
	} else {
		for (i=0; i<6; i++) {
			if (iapins[i] == 1) {
				value = analogRead(A0 + i);
				Serial.write(50+i);
				Serial.write(lowByte(value));
				Serial.write(highByte(value));
			}
		}
		delay(15);
	}
}
/* End of Arduino sketch */
