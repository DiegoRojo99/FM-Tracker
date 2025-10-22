'use client'

import { AdminCompetition } from '@/lib/types/AdminCompetition';
import { useState, useEffect } from 'react';

export default function CompetitionsAdmin() {
  const [competitions, setCompetitions] = useState<AdminCompetition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<AdminCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filters
  const [countryFilter, setCountryFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  
  // Get unique countries
  const countries = Array.from(new Set(competitions.map(c => c.countryCode))).sort();

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = competitions;
    
    if (countryFilter) {
      filtered = filtered.filter(c => c.countryCode === countryFilter);
    }
    
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(c => c.isVisible === (visibilityFilter === 'visible'));
    }
    
    if (groupFilter !== 'all') {
      filtered = filtered.filter(c => c.isGrouped === (groupFilter === 'grouped'));
    }
    
    setFilteredCompetitions(filtered);
  }, [competitions, countryFilter, visibilityFilter, groupFilter]);

  const fetchCompetitions = async () => {
    try {
      const response = await fetch('/api/admin/competitions');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCompetitions(data.competitions || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      alert(`Error loading competitions: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const updateCompetition = (apiCompetitionId: number, updates: Partial<AdminCompetition>) => {
    setCompetitions(prev => prev.map(comp => 
      comp.apiCompetitionId === apiCompetitionId ? { ...comp, ...updates } : comp
    ));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/competitions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(competitions),
      });
      
      if (response.ok) {
        alert('Changes saved successfully!');
      } else {
        throw new Error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const bulkUpdate = (field: keyof AdminCompetition, value: boolean | string | number) => {
    const updates = filteredCompetitions.map(comp => ({
      ...comp,
      [field]: value
    }));
    
    setCompetitions(prev => prev.map(comp => {
      const update = updates.find(u => u.apiCompetitionId === comp.apiCompetitionId);
      return update || comp;
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900">Loading competitions...</div>
          <div className="text-sm text-gray-500">Fetching competition data from database</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Competition Management</h1>
            <p className="text-gray-600 mb-4">Control which competitions are visible to users and how they are organized</p>
            
            <details className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <summary className="cursor-pointer font-semibold text-blue-800 hover:text-blue-900">
                📚 How to use this page (click to expand)
              </summary>
              <div className="mt-3 text-sm text-gray-700 space-y-3">
                <div>
                  <strong className="text-blue-800">🎯 Purpose:</strong> This page lets you control which competitions from your API data appear in the user interface when players create saves.
                </div>
                
                <div>
                  <strong className="text-blue-800">👁️ Visibility Control:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• <strong>Visible (✅):</strong> Competition appears in dropdowns when users create saves</li>
                    <li>• <strong>Hidden (❌):</strong> Competition is hidden from users but data remains in database</li>
                  </ul>
                </div>
                
                <div>
                  <strong className="text-blue-800">🔗 Grouping System:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• <strong>Individual:</strong> Competition appears separately in dropdowns</li>
                    <li>• <strong>Grouped:</strong> Competition is grouped with others (e.g., &quot;Spanish Regional Leagues&quot;)</li>
                    <li>• <strong>Group Name:</strong> The name shown for the group (only active when grouped)</li>
                  </ul>
                </div>
                
                <div>
                  <strong className="text-blue-800">⚡ Workflow:</strong>
                  <ol className="ml-4 mt-1 space-y-1">
                    <li>1. Use <strong>Filters</strong> to find specific competitions (by country, visibility, etc.)</li>
                    <li>2. Toggle <strong>Visible checkbox</strong> to show/hide competitions</li>
                    <li>3. Use <strong>Bulk Actions</strong> to change multiple competitions at once</li>
                    <li>4. Set up <strong>Groups</strong> for related competitions (e.g., regional Spanish leagues)</li>
                    <li>5. Adjust <strong>Priority</strong> numbers to control ordering (higher = appears first)</li>
                    <li>6. Set <strong>Promotion/Relegation</strong> targets to link league hierarchies</li>
                    <li>7. Customize <strong>Display Names</strong> for user-friendly labels</li>
                    <li>8. Click <strong>Save All Changes</strong> to apply your settings</li>
                  </ol>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                  <strong className="text-yellow-800">💡 Tips:</strong>
                  <ul className="ml-4 mt-1 text-yellow-700 space-y-1">
                    <li>• Start by hiding competitions you don&apos;t want (cups, lower divisions)</li>
                    <li>• Group similar competitions (e.g., all Spanish regional groups)</li>
                    <li>• Higher priority numbers appear first in dropdowns</li>
                    <li>• Set promotion targets to higher-priority leagues, relegation to lower-priority leagues</li>
                    <li>• Red rows indicate hidden competitions</li>
                  </ul>
                </div>
              </div>
            </details>
          </div>
          
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Filters</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Countries ({competitions.length})</option>
                  {countries.map(country => {
                    const count = competitions.filter(c => c.countryCode === country).length;
                    return (
                      <option key={country} value={country}>{country} ({count})</option>
                    );
                  })}
                </select>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Visibility</option>
                  <option value="visible">✅ Visible Only</option>
                  <option value="hidden">❌ Hidden Only</option>
                </select>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Grouping</label>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Grouping</option>
                  <option value="grouped">🔗 Grouped Only</option>
                  <option value="ungrouped">Individual Only</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Bulk Actions */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Bulk Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => bulkUpdate('isVisible', true)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <span>✅</span>
                Make Visible ({filteredCompetitions.length})
              </button>
              <button
                onClick={() => bulkUpdate('isVisible', false)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <span>❌</span>
                Hide ({filteredCompetitions.length})
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Save All Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      {/* Competition List */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-lg border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border-r border-gray-600 p-4 text-left font-semibold">Competition</th>
              <th className="border-r border-gray-600 p-4 text-left font-semibold">Country</th>
              <th className="border-r border-gray-600 p-4 text-center font-semibold">Visible</th>
              <th className="border-r border-gray-600 p-4 text-center font-semibold">Grouped</th>
              <th className="border-r border-gray-600 p-4 text-left font-semibold">Group Name</th>
              <th className="border-r border-gray-600 p-4 text-center font-semibold">Priority</th>
              <th className="border-r border-gray-600 p-4 text-left font-semibold">Promotes To</th>
              <th className="border-r border-gray-600 p-4 text-left font-semibold">Relegates To</th>
              <th className="p-4 text-left font-semibold">Display Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCompetitions.map((comp, index) => (
              <tr 
                key={comp.apiCompetitionId} 
                className={`
                  ${comp.isVisible ? 'bg-white hover:bg-blue-50' : 'bg-red-50 hover:bg-red-100'} 
                  transition-colors duration-200
                  ${index % 2 === 0 ? 'bg-opacity-50' : ''}
                `}
              >
                <td className="border-r border-gray-200 p-4">
                  <div className="font-medium text-gray-900">{comp.name}</div>
                  <div className="text-xs text-gray-500 font-mono">ID: {comp.apiCompetitionId}</div>
                </td>
                <td className="border-r border-gray-200 p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {comp.countryCode}
                  </span>
                </td>
                <td className="border-r border-gray-200 p-4 text-center">
                  <input
                    type="checkbox"
                    checked={comp.isVisible}
                    onChange={(e) => updateCompetition(comp.apiCompetitionId, { isVisible: e.target.checked })}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="text-xs mt-1">
                    {comp.isVisible ? 
                      <span className="text-green-600 font-medium">✓ Visible</span> : 
                      <span className="text-red-600 font-medium">✗ Hidden</span>
                    }
                  </div>
                </td>
                <td className="border-r border-gray-200 p-4 text-center">
                  <input
                    type="checkbox"
                    checked={comp.isGrouped}
                    onChange={(e) => updateCompetition(comp.apiCompetitionId, { isGrouped: e.target.checked })}
                    className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <div className="text-xs mt-1">
                    {comp.isGrouped ? 
                      <span className="text-purple-600 font-medium">✓ Grouped</span> : 
                      <span className="text-gray-500">Individual</span>
                    }
                  </div>
                </td>
                <td className="border-r border-gray-200 p-4">
                  <input
                    type="text"
                    value={comp.groupName || ''}
                    onChange={(e) => updateCompetition(comp.apiCompetitionId, { groupName: e.target.value })}
                    placeholder="Enter group name..."
                    className={`
                      w-full px-3 py-2 border rounded-md text-sm
                      ${comp.isGrouped 
                        ? 'border-gray-300 text-black focus:ring-2 focus:ring-purple-500 focus:border-purple-500' 
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                      }
                    `}
                    disabled={!comp.isGrouped}
                  />
                </td>
                <td className="border-r border-gray-200 p-4 text-center">
                  <input
                    type="number"
                    value={comp.priority}
                    onChange={(e) => updateCompetition(comp.apiCompetitionId, { priority: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-2 border border-gray-300 rounded-md text-sm text-center text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="border-r border-gray-200 p-4">
                  <select
                    value={comp.promotionTargetId || ''}
                    onChange={(e) => updateCompetition(comp.apiCompetitionId, { promotionTargetId: e.target.value || undefined })}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">No promotion</option>
                    {competitions
                      .filter(c => c.countryCode === comp.countryCode && c.apiCompetitionId !== comp.apiCompetitionId)
                      .sort((a, b) => b.priority - a.priority)
                      .map(c => (
                        <option key={`promotion-${comp.apiCompetitionId}-${c.apiCompetitionId}`} value={c.apiCompetitionId}>
                          {c.displayName || c.name} (Priority: {c.priority})
                        </option>
                      ))}
                  </select>
                </td>
                <td className="border-r border-gray-200 p-4">
                  <select
                    value={comp.relegationTargetId || ''}
                    onChange={(e) => updateCompetition(comp.apiCompetitionId, { relegationTargetId: e.target.value || undefined })}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">No relegation</option>
                    {competitions
                      .filter(c => c.countryCode === comp.countryCode && c.apiCompetitionId !== comp.apiCompetitionId)
                      .sort((a, b) => a.priority - b.priority)
                      .map(c => (
                        <option key={`relegation-${comp.apiCompetitionId}-${c.apiCompetitionId}`} value={c.apiCompetitionId}>
                          {c.displayName || c.name} (Priority: {c.priority})
                        </option>
                      ))}
                  </select>
                </td>
                <td className="p-4">
                  <input
                    type="text"
                    value={comp.displayName}
                    onChange={(e) => updateCompetition(comp.apiCompetitionId, { displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Custom display name..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 flex items-center justify-between mb-3">
            <span>Showing {filteredCompetitions.length} of {competitions.length} competitions</span>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                Visible ({competitions.filter(c => c.isVisible).length})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                Hidden ({competitions.filter(c => !c.isVisible).length})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
                Grouped ({competitions.filter(c => c.isGrouped).length})
              </span>
            </div>
          </div>
          
          {competitions.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-yellow-800 font-medium mb-2">No competitions found</div>
              <div className="text-yellow-700 text-sm">
                You may need to run the setup script first: 
                <code className="bg-yellow-100 px-2 py-1 rounded ml-1">npx tsx src/scripts/migration/createGameCompetitions.ts</code>
              </div>
            </div>
          )}
          
          {competitions.length > 0 && filteredCompetitions.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-blue-800 font-medium mb-1">No competitions match your filters</div>
              <div className="text-blue-700 text-sm">Try adjusting your filter settings above</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}