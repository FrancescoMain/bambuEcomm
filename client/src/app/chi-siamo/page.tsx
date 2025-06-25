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
  { label: "Anni di Esperienza", value: "15+" },
  { label: "Clienti Soddisfatti", value: "50K+" },
  { label: "Prodotti Venduti", value: "200K+" },
  { label: "Città Servite", value: "100+" },
];

const values = [
  {
    icon: FiCheckCircle,
    title: "Qualità Garantita",
    description:
      "Selezioniamo solo i migliori prodotti per garantire la massima qualità.",
  },
  {
    icon: FiHeart,
    title: "Passione",
    description:
      "La passione per il benessere guida ogni nostra scelta e decisione.",
  },
  {
    icon: FiShield,
    title: "Affidabilità",
    description:
      "Un servizio clienti dedicato e supporto costante per ogni esigenza.",
  },
  {
    icon: FiGlobe,
    title: "Sostenibilità",
    description: "Promuoviamo prodotti eco-friendly e pratiche sostenibili.",
  },
];

const team = [
  {
    name: "Marco Rossi",
    role: "CEO & Fondatore",
    image: "/team/marco.jpg",
    description:
      "Visionario con 20 anni di esperienza nel settore del wellness.",
  },
  {
    name: "Elena Bianchi",
    role: "Direttore Prodotti",
    image: "/team/elena.jpg",
    description: "Esperta in selezione prodotti e ricerca di mercato.",
  },
  {
    name: "Giuseppe Verdi",
    role: "Responsabile Qualità",
    image: "/team/giuseppe.jpg",
    description: "Garantisce i più alti standard di qualità per ogni prodotto.",
  },
];

export default function ChiSiamoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('/bambu-pattern.svg')] opacity-10"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 animate-fade-in">
              <FiAward className="h-16 w-16 mx-auto mb-6 text-emerald-200" />
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Chi Siamo</h1>
              <p className="text-xl md:text-2xl text-emerald-100 leading-relaxed">
                La tua destinazione di fiducia per il benessere naturale dal
                2009
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
                    BambuEcomm nasce nel 2009 dalla passione per il benessere
                    naturale e dalla convinzione che ognuno meriti di vivere una
                    vita più sana e equilibrata.
                  </p>
                  <p>
                    Quello che è iniziato come un piccolo negozio a Torre
                    Annunziata è cresciuto fino a diventare una delle realtà più
                    apprezzate in Italia per prodotti naturali e soluzioni per
                    il benessere.
                  </p>
                  <p>
                    Oggi serviamo migliaia di clienti in tutta Italia,
                    mantenendo sempre i nostri valori fondamentali: qualità,
                    trasparenza e cura del cliente.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <div className="w-full h-80 md:h-96 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                    <div className="text-center text-emerald-600">
                      <FiUsers className="h-20 w-20 mx-auto mb-4" />
                      <p className="text-lg font-medium">La nostra storia</p>
                      <p className="text-sm">Dal 2009 al vostro servizio</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              I Nostri Numeri
            </h2>
            <p className="text-emerald-100 text-lg">
              Anni di crescita e fiducia dei nostri clienti
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-100 mb-2">
                  {stat.value}
                </div>
                <div className="text-emerald-200 font-medium">{stat.label}</div>
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
                Rendere il benessere naturale accessibile a tutti, offrendo
                prodotti di qualità superiore e un servizio clienti eccezionale,
                per aiutare le persone a vivere una vita più sana e felice.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={value.title} className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                    <value.icon className="h-8 w-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
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

      {/* Team Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Il Nostro Team
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Un team di professionisti appassionati, dedicati a offrirti il
                meglio per il tuo benessere
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <div
                  key={member.name}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                      <FiUsers className="h-12 w-12 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {member.name}
                    </h3>
                    <p className="text-emerald-600 font-medium mb-3">
                      {member.role}
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {member.description}
                    </p>
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
                      <FiMapPin className="w-6 h-6 mt-1 text-emerald-600" />
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
                      <FiPhone className="w-6 h-6 mt-1 text-emerald-600" />
                      <div>
                        <p className="font-medium text-gray-900">Telefono</p>
                        <p className="text-gray-600">081 1858 5191</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FiMail className="w-6 h-6 mt-1 text-emerald-600" />
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-gray-600">info@bambuecomm.it</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-start space-x-3">
                      <FiClock className="w-6 h-6 mt-1 text-emerald-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Orari di Apertura
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>Lunedì - Venerdì: 9:00 - 19:00</p>
                          <p>Sabato: 9:00 - 13:00</p>
                          <p>Domenica: Chiuso</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-gray-100 rounded-2xl h-80 md:h-96 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FiGlobe className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg font-medium">Mappa interattiva</p>
                    <p className="text-sm">Google Maps integrazione</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <FiStar className="h-16 w-16 mx-auto mb-6 text-emerald-200" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Inizia il Tuo Viaggio verso il Benessere
            </h2>
            <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
              Scopri la nostra selezione di prodotti naturali e lasciati guidare
              verso una vita più sana e equilibrata
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-colors duration-300 shadow-lg"
              >
                Esplora i Prodotti
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center justify-center px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors duration-300 border-2 border-emerald-400"
              >
                <FiTruck className="h-5 w-5 mr-2" />
                Spedizione Gratuita
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
