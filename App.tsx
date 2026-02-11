
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PlusCircle, 
  Settings as SettingsIcon, 
  Download, 
  Trash2, 
  Clock, 
  Calendar, 
  TrendingUp,
  LayoutDashboard,
  UtensilsCrossed,
  Save,
  Upload,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { TimeEntry, WorkSettings, DashboardStats } from './types';
import { 
  getWeekday, 
  calculateWorkedMinutes, 
  formatMinutesToTime, 
  downloadCSV,
  formatDateBR 
} from './utils/timeUtils';

const App: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>(() => {
    const saved = localStorage.getItem('hc_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<WorkSettings>(() => {
    const saved = localStorage.getItem('hc_settings');
    return saved ? JSON.parse(saved) : {
      dailyStandardMinutes: 480,
      employeeName: '',
      companyName: ''
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    date: '',
    entrance: '',
    lunchStart: '',
    lunchEnd: '',
    exit: '',
    noLunch: false
  });

  useEffect(() => {
    localStorage.setItem('hc_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('hc_settings', JSON.stringify(settings));
  }, [settings]);

  const stats: DashboardStats = useMemo(() => {
    const totalWorked = entries.reduce((acc, curr) => acc + curr.totalWorkedMinutes, 0);
    const totalBalance = entries.reduce((acc, curr) => acc + curr.balanceMinutes, 0);
    return {
      totalWorkedMinutes: totalWorked,
      totalBalanceMinutes: totalBalance,
      entryCount: entries.length
    };
  }, [entries]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const worked = calculateWorkedMinutes(
      formData.entrance,
      formData.lunchStart,
      formData.lunchEnd,
      formData.exit,
      !formData.noLunch
    );
    
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      date: formData.date,
      weekday: getWeekday(formData.date),
      entrance: formData.entrance,
      lunchStart: formData.lunchStart,
      lunchEnd: formData.lunchEnd,
      exit: formData.exit,
      totalWorkedMinutes: worked,
      balanceMinutes: worked - settings.dailyStandardMinutes
    };
    
    setEntries([...entries, newEntry]);
    setFormData({
      date: '',
      entrance: '',
      lunchStart: '',
      lunchEnd: '',
      exit: '',
      noLunch: false
    });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const handleExportCSV = () => {
    downloadCSV(entries, 'horas_trabalhadas.csv');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(';');
      
      const importedEntries: TimeEntry[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(';');
        const entry: TimeEntry = {
          id: Date.now().toString() + i,
          date: values[0].split('/').reverse().join('-'),
          weekday: values[1],
          entrance: values[2],
          lunchStart: values[3] === '-' ? '' : values[3],
          lunchEnd: values[4] === '-' ? '' : values[4],
          exit: values[5],
          totalWorkedMinutes: 0,
          balanceMinutes: 0
        };
        
        entry.totalWorkedMinutes = calculateWorkedMinutes(
          entry.entrance,
          entry.lunchStart,
          entry.lunchEnd,
          entry.exit,
          !!entry.lunchStart
        );
        
        entry.balanceMinutes = entry.totalWorkedMinutes - settings.dailyStandardMinutes;
        importedEntries.push(entry);
      }
      
      setEntries([...entries, ...importedEntries]);
    };
    
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gestor de Banco de Horas</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {settings.companyName && `${settings.companyName} - `}
            {settings.employeeName && settings.employeeName}
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutDashboard className="inline-block w-4 h-4 mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <SettingsIcon className="inline-block w-4 h-4 mr-2" />
                Configurações
              </button>
            </nav>
          </div>

          {activeTab === 'dashboard' && (
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Trabalhado</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatMinutesToTime(stats.totalWorkedMinutes)}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Saldo Acumulado</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatMinutesToTime(stats.totalBalanceMinutes)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Registros</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {stats.entryCount}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Adicionar Registro</h2>
                <form onSubmit={handleAddEntry} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Data e Entrada</label>
                    <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    
                    <input
                      type="time"
                      value={formData.entrance}
                      onChange={(e) => setFormData({...formData, entrance: e.target.value})}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="08:00"
                      required
                    />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Horário de Almoço</label>
                    <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={formData.lunchStart}
                      onChange={(e) => setFormData({...formData, lunchStart: e.target.value})}
                      className={`px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formData.noLunch 
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'border-gray-300'
                      }`}
                      placeholder="12:00"
                      disabled={formData.noLunch}
                    />
                    
                    <input
                      type="time"
                      value={formData.lunchEnd}
                      onChange={(e) => setFormData({...formData, lunchEnd: e.target.value})}
                      className={`px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formData.noLunch 
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'border-gray-300'
                      }`}
                      placeholder="13:00"
                      disabled={formData.noLunch}
                    />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Saída</label>
                    <div className="flex gap-2">
                    <input
                      type="time"
                      value={formData.exit}
                      onChange={(e) => setFormData({...formData, exit: e.target.value})}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="17:00"
                      required
                    />
                    
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.noLunch}
                      onChange={(e) => {
                        const newNoLunch = e.target.checked;
                        setFormData({
                          ...formData, 
                          noLunch: newNoLunch,
                          lunchStart: newNoLunch ? '' : formData.lunchStart,
                          lunchEnd: newNoLunch ? '' : formData.lunchEnd
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Sem almoço</span>
                  </label>
                </form>
              </div>

              <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Registros</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleExportCSV}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center justify-center text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 inline-flex items-center justify-center text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importar CSV
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="overflow-x-auto -mx-4 px-4">
                <div className="min-w-full">
                  <table className="w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Dia</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Almoço</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saída</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          <div className="sm:hidden">
                            <div className="font-medium">{formatDateBR(entry.date)}</div>
                            <div className="text-gray-500">{entry.weekday}</div>
                          </div>
                          <span className="hidden sm:inline">{formatDateBR(entry.date)}</span>
                        </td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                          {entry.weekday}
                        </td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {entry.entrance}
                        </td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                          {entry.lunchStart && entry.lunchEnd 
                            ? `${entry.lunchStart} - ${entry.lunchEnd}`
                            : 'Sem almoço'
                          }
                        </td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {entry.exit}
                        </td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {formatMinutesToTime(entry.totalWorkedMinutes)}
                        </td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          <span className={`${
                            entry.balanceMinutes >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatMinutesToTime(entry.balanceMinutes)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                
                {entries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum registro encontrado
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Configurações</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Funcionário
                  </label>
                  <input
                    type="text"
                    value={settings.employeeName}
                    onChange={(e) => setSettings({...settings, employeeName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jornada Diária (minutos)
                  </label>
                  <input
                    type="number"
                    value={settings.dailyStandardMinutes}
                    onChange={(e) => setSettings({...settings, dailyStandardMinutes: parseInt(e.target.value) || 480})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    480 minutos = 8 horas (padrão)
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => {
                    localStorage.removeItem('hc_entries');
                    localStorage.removeItem('hc_settings');
                    setEntries([]);
                    setSettings({
                      dailyStandardMinutes: 480,
                      employeeName: '',
                      companyName: ''
                    });
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <Database className="w-4 h-4 mr-2 inline" />
                  Limpar Todos os Dados
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;