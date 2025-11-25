import { Hospital, Users, Stethoscope, TestTube, Bed, Clock, Phone, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  const services = [
    { icon: Users, title: 'Patient Care', description: 'Comprehensive patient registration and management' },
    { icon: Stethoscope, title: 'OPD Services', description: 'Outpatient department with token system' },
    { icon: Bed, title: 'Admission & IPD', description: 'In-patient care and admission services' },
    { icon: TestTube, title: 'Laboratory', description: 'Advanced diagnostic and lab testing facilities' }
  ];

  const features = [
    { icon: Clock, text: '24/7 Emergency Services' },
    { icon: Users, text: 'Experienced Medical Staff' },
    { icon: Hospital, text: 'Modern Healthcare Facilities' },
    { icon: Stethoscope, text: 'Specialized Departments' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Hospital className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">North Karachi Hospital</h1>
                <p className="text-sm text-gray-600">Healthcare Excellence Since 1995</p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Staff Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-5xl font-bold text-gray-900">
            Committed to <span className="text-blue-600">Your Health</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Providing quality healthcare services with compassion and excellence.
            Our state-of-the-art facility offers comprehensive medical care for the entire community.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Book Appointment
            </Button>
            <Button size="lg" variant="outline">
              Emergency: Call Now
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white/50">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">Our Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-blue-200"
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-blue-50 rounded-full">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900">{service.title}</h4>
                  <p className="text-gray-600">{service.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">Why Choose Us</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <Phone className="h-8 w-8 mx-auto" />
              <h4 className="text-xl font-semibold">24/7 Helpline</h4>
              <p className="text-blue-100">+92 21 1234-5678</p>
              <p className="text-blue-100">Emergency: 1122</p>
            </div>
            <div className="space-y-3">
              <MapPin className="h-8 w-8 mx-auto" />
              <h4 className="text-xl font-semibold">Location</h4>
              <p className="text-blue-100">North Karachi, Sector 5-C</p>
              <p className="text-blue-100">Karachi, Pakistan</p>
            </div>
            <div className="space-y-3">
              <Clock className="h-8 w-8 mx-auto" />
              <h4 className="text-xl font-semibold">OPD Hours</h4>
              <p className="text-blue-100">Mon - Sat: 8:00 AM - 8:00 PM</p>
              <p className="text-blue-100">Sunday: 9:00 AM - 2:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center gap-2">
              <Hospital className="h-6 w-6 text-blue-400" />
              <span className="font-semibold">North Karachi Hospital</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 North Karachi Hospital. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
