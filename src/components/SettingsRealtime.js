import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook để lắng nghe thay đổi settings realtime
 * @returns {Object} { settings, isMaintenance, loading, error }
 */
export const useSettingsRealtime = () => {
  const [settings, setSettings] = useState({});
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let settingsSubscription;

    const initializeSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy tất cả settings ban đầu
        const { data: initialSettings, error: fetchError } = await supabase
          .from('settings')
          .select('key, value, description')
          .order('key');

        if (fetchError) {
          throw fetchError;
        }

        // Chuyển đổi array thành object
        const settingsObj = {};
        initialSettings.forEach(setting => {
          settingsObj[setting.key] = {
            value: setting.value,
            description: setting.description
          };
        });

        setSettings(settingsObj);
        setIsMaintenance(settingsObj.maintenance_mode?.value === 'true');

        // Subscribe realtime changes
        settingsSubscription = supabase
          .channel('settings-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'settings'
            },
            (payload) => {
              console.log('Settings changed:', payload);
              
              const { key, value } = payload.new;
              
              setSettings(prev => ({
                ...prev,
                [key]: {
                  value,
                  description: prev[key]?.description || ''
                }
              }));

              // Cập nhật trạng thái maintenance mode
              if (key === 'maintenance_mode') {
                setIsMaintenance(value === 'true');
                
                // Hiển thị thông báo cho user
                if (value === 'true') {
                  console.warn('⚠️ Hệ thống đang bảo trì');
                } else {
                  console.info('✅ Hệ thống đã hoạt động trở lại');
                }
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Error initializing settings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeSettings();

    // Cleanup subscription
    return () => {
      if (settingsSubscription) {
        settingsSubscription.unsubscribe();
      }
    };
  }, []);

  return {
    settings,
    isMaintenance,
    loading,
    error
  };
};

/**
 * Component hiển thị trạng thái maintenance mode
 */
export const MaintenanceBanner = () => {
  const { isMaintenance, loading } = useSettingsRealtime();

  if (loading) return null;

  if (!isMaintenance) return null;

  return (
    <div className="bg-red-500 text-white p-4 text-center font-medium">
      <div className="container mx-auto">
        ⚠️ Hệ thống đang bảo trì. Vui lòng quay lại sau!
      </div>
    </div>
  );
};

/**
 * Component để admin quản lý settings
 */
export const SettingsManager = () => {
  const { settings, loading, error } = useSettingsRealtime();
  const [editingKey, setEditingKey] = useState(null);
  const [newValue, setNewValue] = useState('');

  const handleUpdateSetting = async (key, value) => {
    try {
      const { error } = await supabase.rpc('update_setting', {
        setting_key: key,
        setting_value: value
      });

      if (error) {
        throw error;
      }

      setEditingKey(null);
      setNewValue('');
      console.log(`✅ Đã cập nhật ${key} = ${value}`);
    } catch (err) {
      console.error('Error updating setting:', err);
      alert('Lỗi khi cập nhật setting: ' + err.message);
    }
  };

  const startEdit = (key, currentValue) => {
    setEditingKey(key);
    setNewValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setNewValue('');
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Lỗi: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-[#2DA6A2] mb-4">
        Quản lý Settings (Realtime)
      </h3>
      
      <div className="space-y-3">
        {Object.entries(settings).map(([key, setting]) => (
          <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{key}</div>
              <div className="text-sm text-gray-500">{setting.description}</div>
              <div className="text-sm text-gray-700 mt-1">
                Giá trị hiện tại: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{setting.value}</span>
              </div>
            </div>
            
            <div className="ml-4">
              {editingKey === key ? (
                <div className="flex flex-col space-y-2">
                  {key === 'maintenance_message' || key === 'maintenance_estimated_time' ? (
                    <textarea
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                      placeholder="Nhập giá trị mới"
                      rows={3}
                    />
                  ) : (
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="text-gray-900 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                      placeholder="Nhập giá trị mới"
                    />
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateSetting(key, newValue)}
                      className="px-3 py-1 bg-[#2DA6A2] text-white rounded text-sm hover:bg-[#2DA6A2]/90"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(key, setting.value)}
                  className="px-3 py-1 bg-[#2DA6A2] text-white rounded text-sm hover:bg-[#2DA6A2]/90"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Realtime:</strong> Thay đổi sẽ được cập nhật ngay lập tức trên tất cả các tab/thiết bị đang mở.
        </p>
      </div>
    </div>
  );
};

export default {
  useSettingsRealtime,
  MaintenanceBanner,
  SettingsManager
};
