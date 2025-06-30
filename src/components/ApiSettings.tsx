import React, { useState } from 'react';
import { Copy, Key, Database, Code, ExternalLink, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ApiSettings: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  
  const apiKey = 'pk_live_51234567890abcdef1234567890abcdef12345678';
  const baseUrl = 'https://your-app.supabase.co/functions/v1';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copié dans le presse-papiers`);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/commandes',
      description: 'Créer une nouvelle commande',
      example: {
        customer_name: 'Jean Dupont',
        customer_phone: '0123456789',
        customer_email: 'jean@example.com',
        palette_type_id: 'euro',
        quantity: 50,
        delivery_address: '123 Rue de la Livraison, Paris',
        delivery_date: '2024-01-15',
        notes: 'Livraison urgente'
      }
    },
    {
      method: 'PUT',
      path: '/api/commandes/:id/valider',
      description: 'Confirmer une commande provisoire',
      example: {}
    },
    {
      method: 'DELETE',
      path: '/api/commandes/:id',
      description: 'Annuler une commande',
      example: {}
    },
    {
      method: 'GET',
      path: '/api/agenda',
      description: 'Récupérer les créneaux disponibles',
      example: {}
    }
  ];

  const curlExample = `curl -X POST ${baseUrl}/api/commandes \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer_name": "Jean Dupont",
    "customer_phone": "0123456789",
    "palette_type_id": "euro",
    "quantity": 50,
    "delivery_address": "123 Rue de la Livraison, Paris",
    "delivery_date": "2024-01-15"
  }'`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API & Paramètres</h1>
          <p className="text-gray-600">Configuration de l'intégration avec n8n</p>
        </div>
      </div>

      {/* API Key Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex items-center mb-4">
          <Key className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Clé API</h2>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono text-gray-800 break-all flex-1 mr-2">
              {apiKey}
            </code>
            <button
              onClick={() => copyToClipboard(apiKey, 'Clé API')}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
            >
              {copied === 'Clé API' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Important :</strong> Gardez cette clé secrète et ne la partagez jamais publiquement. 
            Utilisez-la uniquement dans vos workflows n8n sécurisés.
          </p>
        </div>
      </div>

      {/* Base URL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex items-center mb-4">
          <Database className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">URL de base</h2>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono text-gray-800 flex-1 mr-2 break-all">
              {baseUrl}
            </code>
            <button
              onClick={() => copyToClipboard(baseUrl, 'URL de base')}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
            >
              {copied === 'URL de base' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex items-center mb-4">
          <Code className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Endpoints disponibles</h2>
        </div>
        
        <div className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium inline-block w-fit ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-gray-800 break-all">
                    {endpoint.path}
                  </code>
                </div>
                <button
                  onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`, `Endpoint ${endpoint.method}`)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors self-start sm:self-center"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
              
              {Object.keys(endpoint.example).length > 0 && (
                <details className="mt-2">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                    Voir l'exemple de payload
                  </summary>
                  <pre className="mt-2 bg-gray-50 rounded p-2 text-xs overflow-x-auto">
                    {JSON.stringify(endpoint.example, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* cURL Example */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Exemple cURL</h2>
          <button
            onClick={() => copyToClipboard(curlExample, 'Exemple cURL')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            {copied === 'Exemple cURL' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        
        <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs lg:text-sm overflow-x-auto">
          {curlExample}
        </pre>
      </div>

      {/* n8n Integration Guide */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex items-center mb-4">
          <ExternalLink className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Intégration n8n</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Configuration étape par étape :</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Créez un nouveau workflow dans n8n</li>
              <li>Ajoutez un nœud "HTTP Request"</li>
              <li>Configurez l'URL : <code className="bg-blue-100 px-1 rounded break-all">{baseUrl}/api/commandes</code></li>
              <li>Méthode : POST</li>
              <li>Headers : 
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li><code className="bg-blue-100 px-1 rounded break-all">Authorization: Bearer {apiKey}</code></li>
                  <li><code className="bg-blue-100 px-1 rounded">Content-Type: application/json</code></li>
                </ul>
              </li>
              <li>Configurez le body avec les données de la commande</li>
            </ol>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Cas d'usage typiques :</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
              <li>Traitement automatique des emails de commande</li>
              <li>Intégration avec un formulaire web</li>
              <li>Synchronisation avec un ERP externe</li>
              <li>Notifications automatiques de validation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSettings;