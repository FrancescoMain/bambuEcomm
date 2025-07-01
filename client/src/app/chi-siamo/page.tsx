"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FiCheckCircle,
  FiHeart,
  FiUsers,
  FiGlobe,
  FiStar,
  FiShield,
  FiTruck,
  FiAward,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
} from "react-icons/fi";

const stats = [
  { label: "Anni di Esperienza", value: "6+" },
  { label: "Clienti Soddisfatti", value: "8K+" },
  { label: "Prodotti in Catalogo", value: "2.5K+" },
  { label: "Ordini Consegnati", value: "15K+" },
];

const values = [
  {
    icon: FiCheckCircle,
    title: "Qualità Garantita",
    description:
      "Selezioniamo solo i migliori prodotti per ufficio, scuola e creatività.",
  },
  {
    icon: FiHeart,
    title: "Passione",
    description:
      "La passione per la cartoleria e l'arte guida ogni nostra scelta.",
  },
  {
    icon: FiShield,
    title: "Affidabilità",
    description:
      "Un servizio clienti dedicato e spedizioni rapide per ogni esigenza.",
  },
  {
    icon: FiTruck,
    title: "Consegna Veloce",
    description: "Spedizioni rapide e sicure in tutta Italia con tracking.",
  },
];

const storeImages = [
  {
    src: "/WhatsApp Image 2025-06-30 at 19.30.46.jpeg",
    alt: "Interno della Cartoleria Bambù",
    title: "Il nostro negozio",
  },
  {
    src: "/WhatsApp Image 2025-06-30 at 19.30.46 (1).jpeg",
    alt: "Prodotti e scaffali",
    title: "La nostra selezione",
  },
  {
    src: "/WhatsApp Image 2025-06-30 at 19.30.47.jpeg",
    alt: "Area vendita",
    title: "Ambiente accogliente",
  },
];

export default function ChiSiamoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center justify-center mb-6">
                <Image
                  src="/bambu-logo.jpg"
                  alt="Cartoleria Bambù"
                  width={80}
                  height={80}
                  className="rounded-full shadow-lg"
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Chi Siamo</h1>
              <p className="text-xl md:text-2xl text-green-100 leading-relaxed">
                La tua cartoleria di fiducia dal 2019 - Tutto per ufficio,
                scuola e creatività
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Storia Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  La Nostra Storia
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p className="text-lg">
                    Cartoleria Bambù nasce nel 2019 dalla passione per la
                    scrittura, la creatività e tutto quello che serve per
                    rendere speciali i momenti di studio e lavoro.
                  </p>
                  <p>
                    Quello che è iniziato come un sogno è cresciuto fino a
                    diventare un punto di riferimento a Torre Annunziata per
                    studenti, professionisti e appassionati di cartoleria.
                  </p>
                  <p>
                    Oggi serviamo clienti in tutta Italia attraverso il nostro
                    negozio online, mantenendo sempre i nostri valori
                    fondamentali: qualità dei prodotti, attenzione al cliente e
                    spedizioni rapide.
                  </p>
                  <p>
                    Dai quaderni più semplici agli accessori più raffinati,
                    dalla cancelleria per ufficio ai materiali artistici: in
                    Bambù trovi tutto quello che serve per esprimere al meglio
                    la tua creatività.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/WhatsApp Image 2025-06-30 at 19.30.46.jpeg"
                    alt="Interno della Cartoleria Bambù"
                    width={600}
                    height={400}
                    className="w-full h-80 md:h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-xl font-bold mb-2">
                      Il nostro negozio
                    </h3>
                    <p className="text-green-100">
                      Dal 2019 al vostro servizio
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#51946b] text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              I Nostri Numeri
            </h2>
            <p className="text-green-100 text-lg">
              6 anni di crescita e fiducia dei nostri clienti
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-100 mb-2">
                  {stat.value}
                </div>
                <div className="text-green-200 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                La Nostra Mission
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Offrire prodotti di qualità per ufficio, scuola e creatività,
                garantendo un servizio eccellente e spedizioni rapide per
                soddisfare tutte le esigenze dei nostri clienti.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={value.title} className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-[#51946b] transition-colors duration-300">
                    <value.icon className="h-8 w-8 text-[#51946b] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Store Gallery Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Il Nostro Negozio
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Vieni a scoprire il nostro spazio accogliente dove trovi tutto
                quello che serve per la scuola, l&apos;ufficio e la creatività
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {storeImages.map((image, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-lg font-semibold">{image.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location & Contact Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Dove Trovarci
              </h2>
              <p className="text-xl text-gray-600">
                Vieni a trovarci nel nostro store o contattaci online
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                    Informazioni di Contatto
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <FiMapPin className="w-6 h-6 mt-1 text-[#51946b]" />
                      <div>
                        <p className="font-medium text-gray-900">Indirizzo</p>
                        <p className="text-gray-600">
                          Corso Umberto I, 367
                          <br />
                          80058 Torre Annunziata (NA)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FiPhone className="w-6 h-6 mt-1 text-[#51946b]" />
                      <div>
                        <p className="font-medium text-gray-900">Telefono</p>
                        <p className="text-gray-600">081 1858 5191</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FiMail className="w-6 h-6 mt-1 text-[#51946b]" />
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-gray-600">Cartoleriabambu@icloud.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-start space-x-3">
                      <FiClock className="w-6 h-6 mt-1 text-[#51946b]" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Orari di Apertura
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>Lunedì - Venerdì: 7:15 - 13:30 / 16:30 - 20:30</p>
                          <p>Sabato: 7:30 - 13:30</p>
                          <p>Domenica: 8:30 - 13:30</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3017.1!2d14.4538!3d40.7536!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x133b944f2f2f2f2f%3A0x1234567890abcdef!2sCorso%20Umberto%20I%2C%20367%2C%2080058%20Torre%20Annunziata%20NA!5e0!3m2!1sit!2sit!4v1704110400000!5m2!1sit!2sit"
                    width="100%"
                    height="384"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Cartoleria Bambù - Corso Umberto I, 367, Torre Annunziata"
                    className="w-full h-80 md:h-96"
                  />
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Cartoleria Bambù</h4>
                        <p className="text-sm text-gray-600">Corso Umberto I, 367</p>
                        <p className="text-sm text-gray-600">80058 Torre Annunziata (NA)</p>
                      </div>
                      <a
                        href="https://maps.google.com/?q=Corso+Umberto+I,+367,+Torre+Annunziata,+NA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#51946b] text-white text-sm rounded-lg hover:bg-[#3d7a57] transition-colors"
                      >
                        Apri in Maps
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="text-6xl mb-6">🛍️</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Inizia il Tuo Shopping
            </h2>
            <p className="text-xl text-green-100 mb-8 leading-relaxed">
              Scopri la nostra selezione di prodotti per ufficio, scuola e
              creatività. Tutto quello che serve per esprimere al meglio le tue
              idee.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#51946b] font-semibold rounded-xl hover:bg-green-50 transition-colors duration-300 shadow-lg"
              >
                Esplora i Prodotti
              </Link>
              <Link
                href="/offerte"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-400 transition-colors duration-300 border-2 border-green-400"
              >
                <FiStar className="h-5 w-5 mr-2" />
                Scopri le Offerte
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
