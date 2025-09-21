"use client";

import { useState, useEffect } from "react";
import { User, BookOpen, ShoppingCart } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";

const books = [
  {
    title: "COFFRET RÉUSSIR EN MATHÉMATIQUES CE1",
    subject: "MATHÉMATIQUES, CE1",
    price: "1700 F CFA",
    image: "/01.png",
  },
  {
    title: "RÉUSSIR EN DICTÉE ORTHOGRAPHE CE1-CE2",
    subject: "FRANÇAIS, CE1, CE2",
    price: "900 F CFA",
    image: "/02.png",
  },
  {
    title: "RÉUSSIR EN MATHÉMATIQUES - MANUEL DE CM2",
    subject: "MATHÉMATIQUES, CM2",
    price: "900 F CFA",
    image: "/01.png",
  },
];

const COLORS = ["#00C853", "#2962FF", "#FF4081"];

const dataQuantites = [
  { name: "Commandes validées", value: 0 },
  { name: "Livraisons en cours", value: 0 },
  { name: "Livrées/Réceptionnées", value: 0 },
];

const dataMontants = [
  { name: "Commandes validées", value: 0 },
  { name: "Livraisons en cours", value: 0 },
  { name: "Livrées/Réceptionnées", value: 0 },
];

export default function ClientDashboard() {
  const [currentBookIndex, setCurrentBookIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBookIndex((prev) => (prev + 1) % books.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentBook = books[currentBookIndex];

  return (
    <DashboardLayout title="">
      {/* Zone graphique */}
      <div className="relative mb-6 w-full">
        <div className="h-80 bg-slate-700 relative overflow-hidden">
          {/* Grille */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full">
              {[0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map((y, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={`${y * 100}%`}
                  x2="100%"
                  y2={`${y * 100}%`}
                  stroke="#626E82"
                  strokeWidth="1"
                />
              ))}
              {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((_, i) => (
                <line
                  key={i}
                  x1={`${(i + 1) * 14.28}%`}
                  y1="0"
                  x2={`${(i + 1) * 14.28}%`}
                  y2="100%"
                  stroke="#626E82"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>

          {/* Labels X */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-around text-[#626E82] text-sm">
            {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map(
              (day) => (
                <span key={day}>{day}</span>
              )
            )}
          </div>

          {/* Labels Y */}
          <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-between text-[#626E82] text-sm py-4">
            {[0.875, 0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0].map((val) => (
              <span key={val}>{val}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {/* Grille générale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Card Client */}
          <div className="bg-[#6967CE] rounded-2xl p-6 text-white flex items-center justify-between shadow-lg h-40">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Client</h3>
                <p className="text-indigo-200">+22952734444</p>
                <span className="inline-block mt-2 px-3 py-1 bg-yellow-500 text-yellow-900 rounded-full text-xs font-medium">
                  Client
                </span>
                <h4>Votre représentant</h4>
                <p>+22952734444</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#FA626B] rounded-2xl p-6 text-white shadow-lg h-40 flex items-center">
            <ShoppingCart className="w-8 h-8 mr-4 opacity-80" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Total des dettes</h3>
              <p className="text-2xl font-bold">
                0 <span className="text-base">Livre(s)</span>
              </p>
              <p className="text-red-100">0 F CFA</p>
            </div>
          </div>

          <div className="bg-gray-700 rounded-2xl p-6 text-white shadow-lg h-40 flex items-center">
            <BookOpen className="w-8 h-8 mr-4 opacity-80" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Stock en dépôt</h3>
              <p className="text-2xl font-bold">
                0 <span className="text-base">Livre(s)</span>
              </p>
              <p className="text-gray-300">0 F CFA</p>
            </div>
          </div>

          <div className="bg-[#5ED84F] rounded-2xl p-6 text-white shadow-lg h-40 flex items-center">
            <ShoppingCart className="w-8 h-8 mr-4 opacity-80" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Vente/Retour</h3>
              <p className="text-2xl font-bold">
                0 <span className="text-base">Livre(s)</span>
              </p>
              <p className="text-green-100">0 F CFA</p>
            </div>
          </div>
        </div>

        {/* Graphiques circulaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Mes commandes (Quantités)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dataQuantites}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={0}
                  dataKey="value"
                >
                  {dataQuantites.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Mes commandes (Montants)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dataMontants}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={0}
                  dataKey="value"
                >
                  {dataMontants.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Liste des livres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {books.map((book, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center text-center"
            >
              <img
                src={book.image}
                alt={book.title}
                className="w-28 h-36 object-contain mb-3"
              />
              <h4 className="font-semibold text-gray-800 text-sm">{book.title}</h4>
              <p className="text-gray-500 text-xs mb-2">— {book.subject}</p>
              <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold text-xs">
                {book.price}
              </div>
            </div>
          ))}
        </div>

        {/* Stock épuisé */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Stock épuisé</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">REF</th>
                <th className="text-left py-2">QTE.RT</th>
                <th className="text-left py-2">QTE.VC</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <span>Philosophie Tle Bac Facile TOME 2</span>
                </td>
                <td>0</td>
                <td>0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
