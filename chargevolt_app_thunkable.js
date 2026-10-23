const ComponentFunction = function() {
  // @section:imports @depends:[]
  const React = require('react');
  const { useState, useEffect, useContext, useMemo, useCallback, useRef } = React;
  const { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, StatusBar, ActivityIndicator, KeyboardAvoidingView, FlatList, Dimensions } = require('react-native');
  const { Ionicons } = require('@react-native-vector-icons/ionicons');
  const { MaterialIcons } = require('@react-native-vector-icons/material-icons');
  const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
  const { createStackNavigator } = require('@react-navigation/stack');
  const { useSafeAreaInsets } = require('react-native-safe-area-context');
  const { useQuery, useMutation, useStorage } = require('platform-hooks');
  const { useBarcodeScanner } = require('platform-hooks');
  const { useLocation } = require('platform-hooks');
  const { useSensors } = require('platform-hooks');
  const { usePushNotifications } = require('platform-hooks');
  // @end:imports

  // @section:theme @depends:[]
  const primaryColor = '#2E86AB';
  const accentColor = '#3B82F6';
  const backgroundColor = '#F8F9FA';
  const cardColor = '#FFFFFF';
  const textPrimary = '#1A1A1A';
  const textSecondary = '#6C757D';
  const designStyle = 'modern';
  const PRICE_PER_KWH = 0.90;
  // @end:theme

  // @section:navigation-setup @depends:[]
  const Tab = createBottomTabNavigator();
  const Stack = createStackNavigator();
  const TAB_MENU_HEIGHT = Platform.OS === 'web' ? 56 : 49;
  const SCROLL_EXTRA_PADDING = 16;
  const WEB_TAB_MENU_PADDING = 90;
  const FAB_SPACING = 16;
  const HEADER_HEIGHT = 60;
  // @end:navigation-setup

  // @section:ThemeContext @depends:[theme]
  const ThemeContext = React.createContext({
    theme: { colors: { primary: primaryColor, accent: accentColor, background: backgroundColor, card: cardColor, textPrimary: textPrimary, textSecondary: textSecondary, border: '#E2E8F0', success: '#10B981', error: '#EF4444', warning: '#F59E0B' } },
    designStyle: designStyle,
  });
  const ThemeProvider = function(props) {
    const lightTheme = useMemo(function() {
      return {
        colors: {
          primary: primaryColor,
          accent: accentColor,
          background: backgroundColor,
          card: cardColor,
          textPrimary: textPrimary,
          textSecondary: textSecondary,
          border: '#E2E8F0',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B'
        }
      };
    }, []);
    const value = useMemo(function() {
      return { theme: lightTheme, designStyle: designStyle };
    }, [lightTheme]);
    return React.createElement(ThemeContext.Provider, { value: value }, props.children);
  };
  const useTheme = function() { return useContext(ThemeContext); };
  // @end:ThemeContext

  // @section:static-data @depends:[]
  const CHARGING_STATIONS = [
    { id: 'st-001', name: 'Shopping Central', location: 'Av. Paulista, 1000 - São Paulo', total_chargers: 4, available_chargers: 3, charger_type: 'CCS / CHAdeMO', status: 'operational', hours: ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'] },
    { id: 'st-002', name: 'Business Center', location: 'Rua das Flores, 250 - São Paulo', total_chargers: 3, available_chargers: 2, charger_type: 'CCS Combo', status: 'operational', hours: ['07:00','08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00'] },
    { id: 'st-003', name: 'Parque Office', location: 'Al. Santos, 700 - São Paulo', total_chargers: 2, available_chargers: 1, charger_type: 'Type 2 AC', status: 'operational', hours: ['06:00','07:00','08:00','09:00','10:00','15:00','16:00','17:00','18:00','19:00','20:00'] },
    { id: 'st-004', name: 'Aeroporto GRU', location: 'Rod. Hélio Smidt, s/n - Guarulhos', total_chargers: 6, available_chargers: 4, charger_type: 'CCS / Type 2', status: 'operational', hours: ['00:00','04:00','08:00','12:00','16:00','20:00'] },
    { id: 'st-005', name: 'Supermercado Extra', location: 'Av. Brigadeiro, 3000 - São Paulo', total_chargers: 2, available_chargers: 0, charger_type: 'Type 2 AC', status: 'maintenance', hours: [] },
  ];

  const REMINDER_OPTIONS = [
    { value: 'none', label: 'Não quero lembrete' },
    { value: '10min', label: '10 minutos antes' },
    { value: '30min', label: '30 minutos antes' },
    { value: '1hour', label: '1 hora antes' },
    { value: '2hours', label: '2 horas antes' },
    { value: '1day', label: '1 dia antes' },
  ];

  const PAYMENT_METHODS = [
    { value: 'pix', label: 'Pix', icon: 'qr-code' },
    { value: 'debit_card', label: 'Cartão de Débito', icon: 'card' },
    { value: 'credit_card', label: 'Cartão de Crédito', icon: 'card' },
    { value: 'monthly_plan', label: 'Plano Mensal', icon: 'calendar' },
  ];
  // @end:static-data

  // @section:helpers @depends:[]
  var generateId = function() {
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
  };

  var formatCurrency = function(value) {
    var num = typeof value === 'number' ? value : parseFloat(value) || 0;
    return 'R$ ' + num.toFixed(2).replace('.', ',');
  };

  var formatTime = function(seconds) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  };

  var formatDate = function(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return (d.getDate() < 10 ? '0' : '') + d.getDate() + '/' + ((d.getMonth() + 1) < 10 ? '0' : '') + (d.getMonth() + 1) + '/' + d.getFullYear();
  };

  var getStatusLabel = function(status) {
    var map = { preparing: 'Preparando', charging: 'Carregando', nearly_complete: 'Quase concluído', completed: 'Concluído', scheduled: 'Agendado', cancelled: 'Cancelado' };
    return map[status] || status;
  };

  var getStatusColor = function(status) {
    var map = { preparing: '#F59E0B', charging: primaryColor, nearly_complete: accentColor, completed: '#10B981', scheduled: accentColor, cancelled: '#EF4444' };
    return map[status] || textSecondary;
  };

  var generateQRData = function(userId, stationId, kwh, cost, type) {
    return {
      userId: userId,
      stationId: stationId,
      kwh: kwh,
      cost: cost,
      type: type,
      timestamp: new Date().toISOString(),
      code: 'EVC-' + Math.random().toString(36).substr(2, 8).toUpperCase()
    };
  };
  // @end:helpers

  // @section:QRCodeVisual @depends:[styles]
  var QRCodeVisual = function(props) {
    var size = props.size || 180;
    var code = props.code || 'QR';
    var rows = 8;
    var cellSize = Math.floor(size / rows);
    var pattern = [
      [1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,1,0,1,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,1,0,1],
      [1,0,1,1,1,0,1,0,0,1,1,1,1,0,0,1],
      [1,0,0,0,0,0,1,0,1,0,0,1,0,0,1,1],
      [1,1,1,1,1,1,1,0,0,0,1,0,1,1,1,0],
      [0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0],
      [1,0,1,1,0,1,0,1,0,1,1,0,0,1,0,1],
      [0,1,0,0,1,0,1,0,1,0,1,1,0,0,1,0],
      [1,0,1,0,0,1,0,1,0,1,0,0,1,1,0,1],
    ];
    return React.createElement(View, {
      style: { width: size, height: size, backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, borderWidth: 2, borderColor: primaryColor },
      componentId: 'qr-code-visual'
    },
      pattern.map(function(row, rowIndex) {
        return React.createElement(View, { key: String(rowIndex), style: { flexDirection: 'row' } },
          row.map(function(cell, colIndex) {
            return React.createElement(View, {
              key: String(colIndex),
              style: {
                width: Math.floor((size - 16) / row.length),
                height: Math.floor((size - 16) / pattern.length),
                backgroundColor: cell ? '#000000' : '#FFFFFF'
              }
            });
          })
        );
      })
    );
  };
  // @end:QRCodeVisual

  // @section:LoginScreen @depends:[ThemeContext,styles]
  var LoginScreen = function(props) {
    var navigation = props.navigation;
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var userState = useStorage('currentUser', null);
    var currentUser = userState[0];
    var setCurrentUser = userState[1];
    var usernameState = useState('');
    var username = usernameState[0];
    var setUsername = usernameState[1];
    var passwordState = useState('');
    var password = passwordState[0];
    var setPassword = passwordState[1];
    var loadingState = useState(false);
    var loading = loadingState[0];
    var setLoading = loadingState[1];

    var profilesQuery = useQuery('profiles');
    var profiles = profilesQuery.data;

    var handleLogin = function() {
      if (!username.trim() || !password.trim()) {
        Platform.OS === 'web' ? window.alert('Por favor, preencha usuário e senha.') : Alert.alert('Atenção', 'Por favor, preencha usuário e senha.');
        return;
      }
      setLoading(true);
      setTimeout(function() {
        setLoading(false);
        var found = null;
        if (profiles && profiles.length > 0) {
          for (var i = 0; i < profiles.length; i++) {
            if (profiles[i].username === username.trim() && profiles[i].password_hash === password.trim()) {
              found = profiles[i];
              break;
            }
          }
        }
        if (!found) {
          if (username.trim() === 'laura.picari' && password.trim() === 'admin123') {
            found = { id: 'admin-001', username: 'laura.picari', full_name: 'Laura Pícari', email: 'laura@goodwe.com', is_admin: true, password_hash: 'admin123' };
          } else if (username.trim() === 'demo' && password.trim() === '123456') {
            found = { id: 'demo-001', username: 'demo', full_name: 'Usuário Demo', email: 'demo@evcharge.com', is_admin: false, password_hash: '123456' };
          }
        }
        if (found) {
          setCurrentUser(found);
          if (found.is_admin) {
            navigation.replace('AdminDashboard');
          } else {
            navigation.replace('MainApp');
          }
        } else {
          Platform.OS === 'web' ? window.alert('Usuário ou senha incorretos.') : Alert.alert('Erro', 'Usuário ou senha incorretos.');
        }
      }, 800);
    };

    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    return React.createElement(View, { style: { flex: 1, backgroundColor: primaryColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40, paddingHorizontal: 24, alignItems: 'center', minHeight: scrollH }
      },
        React.createElement(View, { style: { alignItems: 'center', marginBottom: 40 }, componentId: 'login-logo' },
          React.createElement(View, { style: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } },
            React.createElement(Ionicons, { name: 'flash', size: 44, color: '#FFFFFF' })
          ),
          React.createElement(Text, { style: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 } }, 'EV Charge'),
          React.createElement(Text, { style: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 } }, 'Gestão de recarga elétrica')
        ),
        React.createElement(View, { style: { width: '100%', backgroundColor: cardColor, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 }, componentId: 'login-card' },
          React.createElement(Text, { style: { fontSize: 22, fontWeight: '700', color: textPrimary, marginBottom: 24, textAlign: 'center' } }, 'Entrar'),
          React.createElement(Text, { style: { fontSize: 13, fontWeight: '600', color: textSecondary, marginBottom: 6 } }, 'Usuário'),
          React.createElement(TextInput, {
            value: username,
            onChangeText: setUsername,
            placeholder: 'Digite seu usuário',
            placeholderTextColor: '#B0BEC5',
            autoCapitalize: 'none',
            autoCorrect: false,
            style: styles.input,
            componentId: 'input-username'
          }),
          React.createElement(Text, { style: { fontSize: 13, fontWeight: '600', color: textSecondary, marginBottom: 6, marginTop: 16 } }, 'Senha'),
          React.createElement(TextInput, {
            value: password,
            onChangeText: setPassword,
            placeholder: 'Digite sua senha',
            placeholderTextColor: '#B0BEC5',
            secureTextEntry: true,
            autoCapitalize: 'none',
            autoCorrect: false,
            style: styles.input,
            componentId: 'input-password'
          }),
          React.createElement(TouchableOpacity, {
            onPress: handleLogin,
            disabled: loading,
            style: [styles.primaryButton, { marginTop: 24, opacity: loading ? 0.7 : 1 }],
            componentId: 'btn-login'
          },
            loading
              ? React.createElement(ActivityIndicator, { color: '#FFFFFF', size: 'small' })
              : React.createElement(Text, { style: styles.primaryButtonText }, 'Entrar')
          ),
          React.createElement(TouchableOpacity, {
            onPress: function() { navigation.navigate('Register'); },
            style: { marginTop: 16, alignItems: 'center' },
            componentId: 'btn-register'
          },
            React.createElement(Text, { style: { color: primaryColor, fontSize: 14, fontWeight: '600' } }, 'Criar cadastro')
          )
        ),
        React.createElement(View, { style: { marginTop: 24, padding: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, width: '100%' }, componentId: 'login-hint' },
          React.createElement(Text, { style: { color: 'rgba(255,255,255,0.9)', fontSize: 12, textAlign: 'center' } }, 'Demo: usuário "demo" | senha "123456"'),
          React.createElement(Text, { style: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 2 } }, 'Admin: laura.picari | admin123')
        )
      )
    );
  };
  // @end:LoginScreen

  // @section:RegisterScreen @depends:[ThemeContext,styles]
  var RegisterScreen = function(props) {
    var navigation = props.navigation;
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var nameState = useState('');
    var name = nameState[0];
    var setName = nameState[1];
    var emailState = useState('');
    var email = emailState[0];
    var setEmail = emailState[1];
    var usernameState = useState('');
    var username = usernameState[0];
    var setUsername = usernameState[1];
    var passwordState = useState('');
    var password = passwordState[0];
    var setPassword = passwordState[1];
    var loadingState = useState(false);
    var loading = loadingState[0];
    var setLoading = loadingState[1];
    var insertProfile = useMutation('profiles', 'insert');
    var mutateProfile = insertProfile.mutate;

    var handleRegister = function() {
      if (!name.trim() || !email.trim() || !username.trim() || !password.trim()) {
        Platform.OS === 'web' ? window.alert('Por favor, preencha todos os campos.') : Alert.alert('Atenção', 'Preencha todos os campos.');
        return;
      }
      setLoading(true);
      mutateProfile({
        id: generateId(),
        full_name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        password_hash: password.trim(),
        is_admin: false
      }).then(function() {
        setLoading(false);
        Platform.OS === 'web' ? window.alert('Cadastro realizado! Faça login.') : Alert.alert('Sucesso', 'Cadastro realizado! Faça login.');
        navigation.goBack();
      }).catch(function(err) {
        setLoading(false);
        Platform.OS === 'web' ? window.alert('Erro ao criar cadastro.') : Alert.alert('Erro', 'Erro ao criar cadastro.');
      });
    };

    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    return React.createElement(View, { style: { flex: 1, backgroundColor: primaryColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40, paddingHorizontal: 24, alignItems: 'center' }
      },
        React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24 } },
          React.createElement(TouchableOpacity, { onPress: function() { navigation.goBack(); }, componentId: 'btn-back-register' },
            React.createElement(Ionicons, { name: 'arrow-back', size: 28, color: '#FFFFFF' })
          ),
          React.createElement(Text, { style: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginLeft: 12 } }, 'Criar Cadastro')
        ),
        React.createElement(View, { style: { width: '100%', backgroundColor: cardColor, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }, componentId: 'register-card' },
          React.createElement(Text, { style: { fontSize: 13, fontWeight: '600', color: textSecondary, marginBottom: 6 } }, 'Nome completo'),
          React.createElement(TextInput, { value: name, onChangeText: setName, placeholder: 'Seu nome', placeholderTextColor: '#B0BEC5', autoCapitalize: 'words', style: styles.input, componentId: 'input-name' }),
          React.createElement(Text, { style: { fontSize: 13, fontWeight: '600', color: textSecondary, marginBottom: 6, marginTop: 14 } }, 'E-mail'),
          React.createElement(TextInput, { value: email, onChangeText: setEmail, placeholder: 'seu@email.com', placeholderTextColor: '#B0BEC5', keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false, style: styles.input, componentId: 'input-email' }),
          React.createElement(Text, { style: { fontSize: 13, fontWeight: '600', color: textSecondary, marginBottom: 6, marginTop: 14 } }, 'Usuário'),
          React.createElement(TextInput, { value: username, onChangeText: setUsername, placeholder: 'nome.usuario', placeholderTextColor: '#B0BEC5', autoCapitalize: 'none', autoCorrect: false, style: styles.input, componentId: 'input-reg-username' }),
          React.createElement(Text, { style: { fontSize: 13, fontWeight: '600', color: textSecondary, marginBottom: 6, marginTop: 14 } }, 'Senha'),
          React.createElement(TextInput, { value: password, onChangeText: setPassword, placeholder: 'Crie uma senha', placeholderTextColor: '#B0BEC5', secureTextEntry: true, autoCapitalize: 'none', style: styles.input, componentId: 'input-reg-password' }),
          React.createElement(TouchableOpacity, {
            onPress: handleRegister,
            disabled: loading,
            style: [styles.primaryButton, { marginTop: 24, opacity: loading ? 0.7 : 1 }],
            componentId: 'btn-submit-register'
          },
            loading
              ? React.createElement(ActivityIndicator, { color: '#FFFFFF', size: 'small' })
              : React.createElement(Text, { style: styles.primaryButtonText }, 'Criar Conta')
          )
        )
      )
    );
  };
  // @end:RegisterScreen

  // @section:HomeScreen @depends:[ThemeContext,styles]
  var HomeScreen = function(props) {
    var navigation = props.navigation;
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var userState = useStorage('currentUser', null);
    var currentUser = userState[0];
    var setCurrentUser = userState[1];
    var chargesQuery = useQuery('instant_charges');
    var charges = chargesQuery.data;
    var sessionsQuery = useQuery('scheduled_sessions');
    var sessions = sessionsQuery.data;

    var lastCharge = useMemo(function() {
      if (!charges || charges.length === 0) return null;
      var completed = charges.filter(function(c) { return c.status === 'completed'; });
      if (completed.length === 0) return null;
      return completed[completed.length - 1];
    }, [charges]);

    var nextSession = useMemo(function() {
      if (!sessions || sessions.length === 0) return null;
      var sched = sessions.filter(function(s) { return s.status === 'scheduled'; });
      if (sched.length === 0) return null;
      return sched[0];
    }, [sessions]);

    var userName = currentUser ? (currentUser.full_name ? currentUser.full_name.split(' ')[0] : currentUser.username) : 'Usuário';
    var scrollBottomPadding = Platform.OS === 'web' ? WEB_TAB_MENU_PADDING : (TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING);

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: primaryColor, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 24 }, componentId: 'home-header' },
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 } },
          React.createElement(Text, { style: { fontSize: 13, color: 'rgba(255,255,255,0.75)' } }, 'Bem-vindo(a),'),
          React.createElement(TouchableOpacity, { onPress: function() { setCurrentUser(null); navigation.replace('Login'); }, componentId: 'btn-logout' },
            React.createElement(Ionicons, { name: 'log-out-outline', size: 24, color: 'rgba(255,255,255,0.8)' })
          )
        ),
        React.createElement(Text, { style: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' } }, userName + ' ⚡')
      ),
      React.createElement(ScrollView, {
        style: { flex: 1 },
        contentContainerStyle: { padding: 20, paddingBottom: scrollBottomPadding }
      },
        React.createElement(View, { style: { flexDirection: 'row', gap: 12, marginBottom: 20 }, componentId: 'home-main-actions' },
          React.createElement(TouchableOpacity, {
            onPress: function() { navigation.navigate('NewCharge'); },
            style: { flex: 1, backgroundColor: primaryColor, borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: primaryColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
            componentId: 'btn-new-charge'
          },
            React.createElement(View, { style: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 } },
              React.createElement(Ionicons, { name: 'flash', size: 28, color: '#FFFFFF' })
            ),
            React.createElement(Text, { style: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' } }, 'Nova Recarga'),
            React.createElement(Text, { style: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center', marginTop: 4 } }, 'Iniciar agora')
          ),
          React.createElement(TouchableOpacity, {
            onPress: function() { navigation.navigate('ScheduleStation'); },
            style: { flex: 1, backgroundColor: cardColor, borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 1.5, borderColor: primaryColor },
            componentId: 'btn-schedule'
          },
            React.createElement(View, { style: { width: 48, height: 48, borderRadius: 24, backgroundColor: primaryColor + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 10 } },
              React.createElement(Ionicons, { name: 'calendar', size: 28, color: primaryColor })
            ),
            React.createElement(Text, { style: { color: primaryColor, fontSize: 16, fontWeight: '700', textAlign: 'center' } }, 'Agendar Recarga'),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 } }, 'Reservar horário')
          )
        ),
        lastCharge
          ? React.createElement(View, { style: styles.infoCard, componentId: 'card-last-charge' },
            React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 } },
              React.createElement(Ionicons, { name: 'time-outline', size: 18, color: primaryColor }),
              React.createElement(Text, { style: { fontSize: 14, fontWeight: '700', color: textPrimary, marginLeft: 6 } }, 'Última Recarga')
            ),
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
              React.createElement(View, null,
                React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'Energia'),
                React.createElement(Text, { style: { color: textPrimary, fontSize: 16, fontWeight: '700' } }, (lastCharge.kwh_delivered || 0).toFixed(1) + ' KWh')
              ),
              React.createElement(View, null,
                React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'Valor'),
                React.createElement(Text, { style: { color: textPrimary, fontSize: 16, fontWeight: '700' } }, formatCurrency(lastCharge.total_cost))
              ),
              React.createElement(View, null,
                React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'Status'),
                React.createElement(Text, { style: { color: '#10B981', fontSize: 14, fontWeight: '600' } }, 'Concluído')
              )
            )
          )
          : React.createElement(View, { style: [styles.infoCard, { alignItems: 'center', paddingVertical: 24 }], componentId: 'card-no-charge' },
            React.createElement(Ionicons, { name: 'battery-dead-outline', size: 36, color: textSecondary }),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 14, marginTop: 8 } }, 'Nenhuma recarga realizada ainda'),
            React.createElement(Text, { style: { color: primaryColor, fontSize: 13, fontWeight: '600', marginTop: 4 } }, 'Inicie sua primeira recarga!')
          ),
        nextSession
          ? React.createElement(View, { style: [styles.infoCard, { marginTop: 12 }], componentId: 'card-next-session' },
            React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 } },
              React.createElement(Ionicons, { name: 'calendar-outline', size: 18, color: accentColor }),
              React.createElement(Text, { style: { fontSize: 14, fontWeight: '700', color: textPrimary, marginLeft: 6 } }, 'Próximo Agendamento')
            ),
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
              React.createElement(View, null,
                React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'Data'),
                React.createElement(Text, { style: { color: textPrimary, fontSize: 14, fontWeight: '700' } }, formatDate(nextSession.scheduled_date))
              ),
              React.createElement(View, null,
                React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'Horário'),
                React.createElement(Text, { style: { color: textPrimary, fontSize: 14, fontWeight: '700' } }, nextSession.scheduled_time || '--:--')
              ),
              React.createElement(View, null,
                React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'KWh'),
                React.createElement(Text, { style: { color: textPrimary, fontSize: 14, fontWeight: '700' } }, nextSession.kwh_requested + ' KWh')
              )
            )
          )
          : null,
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, backgroundColor: cardColor, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }, componentId: 'home-stats' },
          React.createElement(View, { style: { alignItems: 'center' } },
            React.createElement(Text, { style: { fontSize: 22, fontWeight: '800', color: primaryColor } }, charges ? charges.filter(function(c) { return c.status === 'completed'; }).length : 0),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 2 } }, 'Recargas')
          ),
          React.createElement(View, { style: { width: 1, backgroundColor: '#E2E8F0' } }),
          React.createElement(View, { style: { alignItems: 'center' } },
            React.createElement(Text, { style: { fontSize: 22, fontWeight: '800', color: accentColor } }, charges ? charges.filter(function(c) { return c.status === 'completed'; }).reduce(function(sum, c) { return sum + (c.kwh_delivered || 0); }, 0).toFixed(0) : 0),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 2 } }, 'KWh Total')
          ),
          React.createElement(View, { style: { width: 1, backgroundColor: '#E2E8F0' } }),
          React.createElement(View, { style: { alignItems: 'center' } },
            React.createElement(Text, { style: { fontSize: 22, fontWeight: '800', color: '#10B981' } }, sessions ? sessions.filter(function(s) { return s.status === 'scheduled'; }).length : 0),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 2 } }, 'Agendados')
          )
        )
      )
    );
  };
  // @end:HomeScreen

  // @section:HistoryScreen @depends:[ThemeContext,styles]
  var HistoryScreen = function(props) {
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var chargesQuery = useQuery('instant_charges');
    var charges = chargesQuery.data;
    var sessionsQuery = useQuery('scheduled_sessions');
    var sessions = sessionsQuery.data;
    var tabState = useState('charges');
    var activeTab = tabState[0];
    var setActiveTab = tabState[1];
    var scrollBottomPadding = Platform.OS === 'web' ? WEB_TAB_MENU_PADDING : (TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING);

    var renderChargeItem = function(item) {
      var station = CHARGING_STATIONS.find(function(s) { return s.id === item.station_id; }) || { name: 'Estação' };
      return React.createElement(View, { key: item.id, style: [styles.infoCard, { marginBottom: 10 }], componentId: 'history-item-' + item.id },
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 } },
          React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 14 } }, station.name),
          React.createElement(View, { style: { backgroundColor: getStatusColor(item.status) + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 } },
            React.createElement(Text, { style: { color: getStatusColor(item.status), fontSize: 12, fontWeight: '600' } }, getStatusLabel(item.status))
          )
        ),
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
          React.createElement(View, null,
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'KWh'),
            React.createElement(Text, { style: { color: textPrimary, fontWeight: '700' } }, (item.kwh_delivered || item.kwh_requested || 0).toFixed(1) + ' KWh')
          ),
          React.createElement(View, null,
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'Valor'),
            React.createElement(Text, { style: { color: textPrimary, fontWeight: '700' } }, formatCurrency(item.total_cost))
          ),
          React.createElement(View, null,
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'Pagamento'),
            React.createElement(Text, { style: { color: textPrimary, fontWeight: '600', fontSize: 12 } }, item.payment_method || '-')
          )
        ),
        item.created_at ? React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginTop: 6 } }, 'Criado em: ' + formatDate(item.created_at)) : null
      );
    };

    var renderSessionItem = function(item) {
      var station = CHARGING_STATIONS.find(function(s) { return s.id === item.station_id; }) || { name: 'Estação' };
      return React.createElement(View, { key: item.id, style: [styles.infoCard, { marginBottom: 10 }], componentId: 'history-session-' + item.id },
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 } },
          React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 14 } }, station.name),
          React.createElement(View, { style: { backgroundColor: getStatusColor(item.status) + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 } },
            React.createElement(Text, { style: { color: getStatusColor(item.status), fontSize: 12, fontWeight: '600' } }, getStatusLabel(item.status))
          )
        ),
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
          React.createElement(View, null,
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'Data'),
            React.createElement(Text, { style: { color: textPrimary, fontWeight: '700' } }, formatDate(item.scheduled_date))
          ),
          React.createElement(View, null,
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'Horário'),
            React.createElement(Text, { style: { color: textPrimary, fontWeight: '700' } }, item.scheduled_time || '--:--')
          ),
          React.createElement(View, null,
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'KWh / Valor'),
            React.createElement(Text, { style: { color: textPrimary, fontWeight: '700' } }, item.kwh_requested + 'KWh · ' + formatCurrency(item.estimated_cost))
          )
        )
      );
    };

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: primaryColor, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 16 }, componentId: 'history-header' },
        React.createElement(Text, { style: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' } }, 'Histórico')
      ),
      React.createElement(View, { style: { flexDirection: 'row', backgroundColor: cardColor, margin: 16, borderRadius: 12, padding: 4 }, componentId: 'history-tabs' },
        React.createElement(TouchableOpacity, {
          onPress: function() { setActiveTab('charges'); },
          style: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: activeTab === 'charges' ? primaryColor : 'transparent', alignItems: 'center' },
          componentId: 'tab-charges'
        }, React.createElement(Text, { style: { color: activeTab === 'charges' ? '#FFFFFF' : textSecondary, fontWeight: '600', fontSize: 14 } }, 'Recargas')),
        React.createElement(TouchableOpacity, {
          onPress: function() { setActiveTab('sessions'); },
          style: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: activeTab === 'sessions' ? primaryColor : 'transparent', alignItems: 'center' },
          componentId: 'tab-sessions'
        }, React.createElement(Text, { style: { color: activeTab === 'sessions' ? '#FFFFFF' : textSecondary, fontWeight: '600', fontSize: 14 } }, 'Agendamentos'))
      ),
      React.createElement(ScrollView, {
        style: { flex: 1 },
        contentContainerStyle: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: scrollBottomPadding }
      },
        activeTab === 'charges'
          ? (charges && charges.length > 0 ? charges.slice().reverse().map(renderChargeItem)
            : React.createElement(View, { style: { alignItems: 'center', paddingVertical: 40 } },
              React.createElement(Ionicons, { name: 'flash-outline', size: 48, color: textSecondary }),
              React.createElement(Text, { style: { color: textSecondary, marginTop: 12, fontSize: 15 } }, 'Nenhuma recarga realizada ainda')
            ))
          : (sessions && sessions.length > 0 ? sessions.slice().reverse().map(renderSessionItem)
            : React.createElement(View, { style: { alignItems: 'center', paddingVertical: 40 } },
              React.createElement(Ionicons, { name: 'calendar-outline', size: 48, color: textSecondary }),
              React.createElement(Text, { style: { color: textSecondary, marginTop: 12, fontSize: 15 } }, 'Nenhum agendamento realizado ainda')
            ))
      )
    );
  };
  // @end:HistoryScreen

  // @section:NewChargeScreen @depends:[ThemeContext,styles]
  var NewChargeScreen = function(props) {
    var navigation = props.navigation;
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var modeState = useState('kwh');
    var mode = modeState[0];
    var setMode = modeState[1];
    var kwhState = useState('20');
    var kwh = kwhState[0];
    var setKwh = kwhState[1];
    var hoursState = useState('1');
    var hours = hoursState[0];
    var setHours = hoursState[1];
    var minutesState = useState('0');
    var minutes = minutesState[0];
    var setMinutes = minutesState[1];

    var KWH_PRESETS = [10, 20, 30, 40, 50, 60];
    var POWER_KW = 7.4;

    var calculatedKwh = useMemo(function() {
      if (mode === 'kwh') {
        var v = parseFloat(kwh) || 0;
        return v;
      } else {
        var h = parseFloat(hours) || 0;
        var m = parseFloat(minutes) || 0;
        var totalHours = h + m / 60;
        return parseFloat((totalHours * POWER_KW).toFixed(2));
      }
    }, [mode, kwh, hours, minutes]);

    var calculatedCost = useMemo(function() {
      return parseFloat((calculatedKwh * PRICE_PER_KWH).toFixed(2));
    }, [calculatedKwh]);

    var calculatedDuration = useMemo(function() {
      if (mode === 'time') {
        var h = parseFloat(hours) || 0;
        var m = parseFloat(minutes) || 0;
        return Math.round(h * 60 + m);
      } else {
        var v = parseFloat(kwh) || 0;
        return Math.round((v / POWER_KW) * 60);
      }
    }, [mode, kwh, hours, minutes]);

    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: primaryColor, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' } },
        React.createElement(TouchableOpacity, { onPress: function() { navigation.goBack(); }, componentId: 'btn-back-newcharge' },
          React.createElement(Ionicons, { name: 'arrow-back', size: 24, color: '#FFFFFF' })
        ),
        React.createElement(Text, { style: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginLeft: 12 } }, 'Nova Recarga')
      ),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH - 60, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 100 }
      },
        React.createElement(View, { style: { flexDirection: 'row', backgroundColor: cardColor, borderRadius: 12, padding: 4, marginBottom: 20 }, componentId: 'charge-mode-tabs' },
          React.createElement(TouchableOpacity, {
            onPress: function() { setMode('kwh'); },
            style: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: mode === 'kwh' ? primaryColor : 'transparent', alignItems: 'center' },
            componentId: 'mode-kwh'
          }, React.createElement(Text, { style: { color: mode === 'kwh' ? '#FFFFFF' : textSecondary, fontWeight: '700' } }, 'Por KWh')),
          React.createElement(TouchableOpacity, {
            onPress: function() { setMode('time'); },
            style: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: mode === 'time' ? primaryColor : 'transparent', alignItems: 'center' },
            componentId: 'mode-time'
          }, React.createElement(Text, { style: { color: mode === 'time' ? '#FFFFFF' : textSecondary, fontWeight: '700' } }, 'Por Tempo'))
        ),
        mode === 'kwh'
          ? React.createElement(View, { style: styles.card, componentId: 'kwh-selector' },
            React.createElement(Text, { style: { fontSize: 15, fontWeight: '700', color: textPrimary, marginBottom: 14 } }, 'Quantos KWh deseja adicionar?'),
            React.createElement(View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 } },
              KWH_PRESETS.map(function(v) {
                var selected = parseFloat(kwh) === v;
                return React.createElement(TouchableOpacity, {
                  key: String(v),
                  onPress: function() { setKwh(String(v)); },
                  style: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: selected ? primaryColor : backgroundColor, borderWidth: 1.5, borderColor: selected ? primaryColor : '#E2E8F0' },
                  componentId: 'kwh-preset-' + v
                }, React.createElement(Text, { style: { color: selected ? '#FFFFFF' : textPrimary, fontWeight: '600' } }, v + ' KWh'));
              })
            ),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginBottom: 6 } }, 'Ou informe um valor personalizado:'),
            React.createElement(TextInput, {
              value: kwh,
              onChangeText: function(t) { setKwh(t.replace(/[^0-9.]/g, '')); },
              placeholder: 'Ex: 25',
              keyboardType: 'decimal-pad',
              style: styles.input,
              componentId: 'input-kwh'
            })
          )
          : React.createElement(View, { style: styles.card, componentId: 'time-selector' },
            React.createElement(Text, { style: { fontSize: 15, fontWeight: '700', color: textPrimary, marginBottom: 14 } }, 'Por quanto tempo deseja carregar?'),
            React.createElement(View, { style: { flexDirection: 'row', gap: 12 } },
              React.createElement(View, { style: { flex: 1 } },
                React.createElement(Text, { style: { color: textSecondary, fontSize: 13, marginBottom: 6 } }, 'Horas'),
                React.createElement(TextInput, {
                  value: hours,
                  onChangeText: function(t) { setHours(t.replace(/[^0-9]/g, '')); },
                  placeholder: '1',
                  keyboardType: 'numeric',
                  style: styles.input,
                  componentId: 'input-hours'
                })
              ),
              React.createElement(View, { style: { flex: 1 } },
                React.createElement(Text, { style: { color: textSecondary, fontSize: 13, marginBottom: 6 } }, 'Minutos'),
                React.createElement(TextInput, {
                  value: minutes,
                  onChangeText: function(t) { setMinutes(t.replace(/[^0-9]/g, '')); },
                  placeholder: '30',
                  keyboardType: 'numeric',
                  style: styles.input,
                  componentId: 'input-minutes'
                })
              )
            ),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 8 } }, 'Potência do carregador: ' + POWER_KW + ' kW')
          ),
        React.createElement(View, { style: [styles.card, { marginTop: 16 }], componentId: 'charge-summary' },
          React.createElement(Text, { style: { fontSize: 15, fontWeight: '700', color: textPrimary, marginBottom: 14 } }, 'Resumo da Recarga'),
          React.createElement(View, { style: styles.summaryRow },
            React.createElement(Text, { style: styles.summaryLabel }, 'Energia'),
            React.createElement(Text, { style: styles.summaryValue }, calculatedKwh.toFixed(2) + ' KWh')
          ),
          React.createElement(View, { style: styles.summaryRow },
            React.createElement(Text, { style: styles.summaryLabel }, 'Preço por KWh'),
            React.createElement(Text, { style: styles.summaryValue }, formatCurrency(PRICE_PER_KWH) + '/KWh')
          ),
          React.createElement(View, { style: styles.summaryRow },
            React.createElement(Text, { style: styles.summaryLabel }, 'Duração estimada'),
            React.createElement(Text, { style: styles.summaryValue }, Math.floor(calculatedDuration / 60) + 'h ' + (calculatedDuration % 60) + 'min')
          ),
          React.createElement(View, { style: [styles.summaryRow, { borderTopWidth: 1.5, borderTopColor: '#E2E8F0', marginTop: 8, paddingTop: 12 }] },
            React.createElement(Text, { style: { fontWeight: '800', color: textPrimary, fontSize: 16 } }, 'Total'),
            React.createElement(Text, { style: { fontWeight: '800', color: primaryColor, fontSize: 20 } }, formatCurrency(calculatedCost))
          )
        ),
        React.createElement(TouchableOpacity, {
          onPress: function() {
            if (calculatedKwh <= 0) {
              Platform.OS === 'web' ? window.alert('Informe uma quantidade válida.') : Alert.alert('Atenção', 'Informe uma quantidade válida.');
              return;
            }
            navigation.navigate('QRStation', { kwh: calculatedKwh, cost: calculatedCost, duration: calculatedDuration });
          },
          style: [styles.primaryButton, { marginTop: 20 }],
          componentId: 'btn-proceed-qr'
        }, React.createElement(Text, { style: styles.primaryButtonText }, 'Identificar Estação →'))
      )
    );
  };
  // @end:NewChargeScreen

  // @section:QRStationScreen @depends:[ThemeContext,styles,QRCodeVisual]
  var QRStationScreen = function(props) {
    var navigation = props.navigation;
    var route = props.route;
    var params = route && route.params ? route.params : {};
    var kwh = params.kwh || 20;
    var cost = params.cost || 18;
    var duration = params.duration || 162;
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var userState = useStorage('currentUser', null);
    var currentUser = userState[0];
    var scannerHook = useBarcodeScanner();
    var scan = scannerHook.scan;
    var isAvailable = scannerHook.isAvailable;
    var selectedStationState = useState(null);
    var selectedStation = selectedStationState[0];
    var setSelectedStation = selectedStationState[1];
    var scannedState = useState(false);
    var scanned = scannedState[0];
    var setScanned = scannedState[1];

    var qrData = useMemo(function() {
      return generateQRData(
        currentUser ? currentUser.id : 'user-001',
        selectedStation ? selectedStation.id : 'st-001',
        kwh,
        cost,
        'instant_charge'
      );
    }, [currentUser, selectedStation, kwh, cost]);

    var handleScan = function() {
      if (isAvailable) {
        scan().then(function(result) {
          if (!result.cancelled && !result.error) {
            var stIdx = Math.floor(Math.random() * 3);
            setSelectedStation(CHARGING_STATIONS[stIdx]);
            setScanned(true);
          }
        });
      } else {
        var stIdx = Math.floor(Math.random() * 3);
        setSelectedStation(CHARGING_STATIONS[stIdx]);
        setScanned(true);
      }
    };

    var availableStations = CHARGING_STATIONS.filter(function(s) { return s.status === 'operational' && s.available_chargers > 0; });
    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: primaryColor, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' } },
        React.createElement(TouchableOpacity, { onPress: function() { navigation.goBack(); }, componentId: 'btn-back-qr' },
          React.createElement(Ionicons, { name: 'arrow-back', size: 24, color: '#FFFFFF' })
        ),
        React.createElement(Text, { style: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginLeft: 12 } }, 'Identificar Estação')
      ),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH - 60, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 40, alignItems: 'center' }
      },
        React.createElement(Text, { style: { fontSize: 15, color: textSecondary, textAlign: 'center', marginBottom: 16 } }, 'Apresente o QR Code na estação de carregamento ou selecione uma estação manualmente.'),
        React.createElement(View, { style: { marginBottom: 20, alignItems: 'center' }, componentId: 'qr-display' },
          React.createElement(QRCodeVisual, { size: 200, code: qrData.code }),
          React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 8 } }, 'Código: ' + qrData.code)
        ),
        scanned && selectedStation
          ? React.createElement(View, { style: [styles.card, { width: '100%', marginBottom: 16 }], componentId: 'scanned-station' },
            React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 } },
              React.createElement(View, { style: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginRight: 8 } }),
              React.createElement(Text, { style: { color: '#10B981', fontWeight: '700', fontSize: 14 } }, 'Estação Identificada!')
            ),
            React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 16 } }, selectedStation.name),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 13, marginTop: 4 } }, selectedStation.location),
            React.createElement(Text, { style: { color: primaryColor, fontSize: 13, marginTop: 4 } }, selectedStation.available_chargers + ' carregadores disponíveis')
          )
          : null,
        React.createElement(TouchableOpacity, {
          onPress: handleScan,
          style: [styles.primaryButton, { width: '100%', marginBottom: 12 }],
          componentId: 'btn-scan'
        }, React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
          React.createElement(Ionicons, { name: 'qr-code-outline', size: 20, color: '#FFFFFF' }),
          React.createElement(Text, { style: [styles.primaryButtonText, { marginLeft: 8 }] }, isAvailable ? 'Escanear QR Code' : 'Simular Leitura')
        )),
        React.createElement(Text, { style: { color: textSecondary, fontSize: 13, marginBottom: 10 } }, 'Ou selecione uma estação:'),
        availableStations.map(function(st) {
          var sel = selectedStation && selectedStation.id === st.id;
          return React.createElement(TouchableOpacity, {
            key: st.id,
            onPress: function() { setSelectedStation(st); setScanned(true); },
            style: [styles.card, { width: '100%', marginBottom: 8, borderWidth: 2, borderColor: sel ? primaryColor : 'transparent' }],
            componentId: 'station-item-' + st.id
          },
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement(View, { style: { flex: 1 } },
                React.createElement(Text, { style: { fontWeight: '700', color: textPrimary } }, st.name),
                React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 2 } }, st.location),
                React.createElement(Text, { style: { color: '#10B981', fontSize: 12, marginTop: 2 } }, st.available_chargers + ' disponíveis · ' + st.charger_type)
              ),
              sel ? React.createElement(Ionicons, { name: 'checkmark-circle', size: 24, color: primaryColor }) : null
            )
          );
        }),
        scanned && selectedStation
          ? React.createElement(TouchableOpacity, {
            onPress: function() { navigation.navigate('Payment', { kwh: kwh, cost: cost, duration: duration, stationId: selectedStation.id, stationName: selectedStation.name, qrData: qrData }); },
            style: [styles.primaryButton, { width: '100%', marginTop: 16 }],
            componentId: 'btn-proceed-payment'
          }, React.createElement(Text, { style: styles.primaryButtonText }, 'Ir para Pagamento →'))
          : null
      )
    );
  };
  // @end:QRStationScreen

  // @section:PaymentScreen @depends:[ThemeContext,styles]
  var PaymentScreen = function(props) {
    var navigation = props.navigation;
    var route = props.route;
    var params = route && route.params ? route.params : {};
    var kwh = params.kwh || 20;
    var cost = params.cost || 18;
    var duration = params.duration || 162;
    var stationId = params.stationId || 'st-001';
    var stationName = params.stationName || 'Estação';
    var qrData = params.qrData || {};
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var userState = useStorage('currentUser', null);
    var currentUser = userState[0];
    var payMethodState = useState('pix');
    var payMethod = payMethodState[0];
    var setPayMethod = payMethodState[1];
    var payTypeState = useState('immediate');
    var payType = payTypeState[0];
    var setPayType = payTypeState[1];
    var payDayState = useState('5');
    var payDay = payDayState[0];
    var setPayDay = payDayState[1];
    var loadingState = useState(false);
    var loading = loadingState[0];
    var setLoading = loadingState[1];
    var insertCharge = useMutation('instant_charges', 'insert');
    var mutateCharge = insertCharge.mutate;
    var insertPayment = useMutation('payments', 'insert');
    var mutatePayment = insertPayment.mutate;
    var insertQR = useMutation('qr_code_logs', 'insert');
    var mutateQR = insertQR.mutate;

    var goodweShare = parseFloat((cost * 0.10).toFixed(2));
    var venueShare = parseFloat((cost * 0.90).toFixed(2));
    var transactionId = 'TXN-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    var chargeId = generateId();
    var userId = currentUser ? currentUser.id : 'demo-001';

    var handleConfirmPayment = function() {
      setLoading(true);
      mutateCharge({
        id: chargeId,
        user_id: userId,
        station_id: stationId,
        kwh_requested: kwh,
        kwh_delivered: 0,
        duration_minutes: duration,
        total_cost: cost,
        price_per_kwh: PRICE_PER_KWH,
        status: 'preparing',
        payment_method: payType === 'monthly' ? 'monthly_plan' : payMethod,
        payment_status: 'completed',
        goodwe_share: goodweShare,
        venue_share: venueShare,
        qr_code_data: qrData,
        started_at: new Date().toISOString()
      }).then(function() {
        return mutatePayment({
          id: generateId(),
          user_id: userId,
          charge_id: chargeId,
          amount: cost,
          currency: 'BRL',
          payment_method: payType === 'monthly' ? 'monthly_plan' : payMethod,
          payment_status: 'completed',
          goodwe_share_amount: goodweShare,
          venue_share_amount: venueShare,
          goodwe_share_percent: 10,
          venue_share_percent: 90,
          transaction_id: transactionId,
          payment_date: new Date().toISOString().split('T')[0]
        });
      }).then(function() {
        return mutateQR({
          id: generateId(),
          qr_code_value: qrData.code || 'QR-' + transactionId,
          user_id: userId,
          charge_id: chargeId,
          station_id: stationId,
          kwh_value: kwh,
          cost_value: cost,
          scanned_at: new Date().toISOString()
        });
      }).then(function() {
        setLoading(false);
        navigation.navigate('ChargingMonitor', {
          chargeId: chargeId,
          kwh: kwh,
          cost: cost,
          duration: duration,
          stationName: stationName,
          paymentMethod: payType === 'monthly' ? 'Plano Mensal' : payMethod,
          transactionId: transactionId
        });
      }).catch(function() {
        setLoading(false);
        navigation.navigate('ChargingMonitor', {
          chargeId: chargeId,
          kwh: kwh,
          cost: cost,
          duration: duration,
          stationName: stationName,
          paymentMethod: payType === 'monthly' ? 'Plano Mensal' : payMethod,
          transactionId: transactionId
        });
      });
    };

    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: primaryColor, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' } },
        React.createElement(TouchableOpacity, { onPress: function() { navigation.goBack(); }, componentId: 'btn-back-payment' },
          React.createElement(Ionicons, { name: 'arrow-back', size: 24, color: '#FFFFFF' })
        ),
        React.createElement(Text, { style: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginLeft: 12 } }, 'Pagamento')
      ),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH - 60, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 80 }
      },
        React.createElement(View, { style: [styles.card, { marginBottom: 16 }], componentId: 'payment-total-card' },
          React.createElement(Text, { style: { color: textSecondary, fontSize: 13 } }, 'Valor total da recarga'),
          React.createElement(Text, { style: { fontSize: 32, fontWeight: '800', color: primaryColor, marginTop: 4 } }, formatCurrency(cost)),
          React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 4 } }, stationName + ' · ' + kwh.toFixed(2) + ' KWh')
        ),
        React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginBottom: 12 } }, 'Tipo de pagamento'),
        React.createElement(View, { style: { flexDirection: 'row', gap: 10, marginBottom: 20 } },
          React.createElement(TouchableOpacity, {
            onPress: function() { setPayType('immediate'); },
            style: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: payType === 'immediate' ? primaryColor : cardColor, alignItems: 'center', borderWidth: 1.5, borderColor: payType === 'immediate' ? primaryColor : '#E2E8F0' },
            componentId: 'type-immediate'
          }, React.createElement(Text, { style: { color: payType === 'immediate' ? '#FFFFFF' : textSecondary, fontWeight: '700' } }, 'Imediato')),
          React.createElement(TouchableOpacity, {
            onPress: function() { setPayType('monthly'); },
            style: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: payType === 'monthly' ? primaryColor : cardColor, alignItems: 'center', borderWidth: 1.5, borderColor: payType === 'monthly' ? primaryColor : '#E2E8F0' },
            componentId: 'type-monthly'
          }, React.createElement(Text, { style: { color: payType === 'monthly' ? '#FFFFFF' : textSecondary, fontWeight: '700' } }, 'Plano Mensal'))
        ),
        payType === 'immediate'
          ? React.createElement(View, { componentId: 'immediate-methods' },
            React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginBottom: 12 } }, 'Método de pagamento'),
            PAYMENT_METHODS.filter(function(m) { return m.value !== 'monthly_plan'; }).map(function(m) {
              var sel = payMethod === m.value;
              return React.createElement(TouchableOpacity, {
                key: m.value,
                onPress: function() { setPayMethod(m.value); },
                style: [styles.card, { marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: sel ? primaryColor : 'transparent' }],
                componentId: 'method-' + m.value
              },
                React.createElement(View, { style: { width: 44, height: 44, borderRadius: 22, backgroundColor: sel ? primaryColor : backgroundColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 } },
                  React.createElement(Ionicons, { name: m.icon, size: 22, color: sel ? '#FFFFFF' : textSecondary })
                ),
                React.createElement(Text, { style: { fontWeight: '600', color: sel ? primaryColor : textPrimary, fontSize: 15 } }, m.label),
                sel ? React.createElement(View, { style: { marginLeft: 'auto' } }, React.createElement(Ionicons, { name: 'checkmark-circle', size: 22, color: primaryColor })) : null
              );
            })
          )
          : React.createElement(View, { style: styles.card, componentId: 'monthly-options' },
            React.createElement(Ionicons, { name: 'calendar', size: 28, color: primaryColor }),
            React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginTop: 8, marginBottom: 8 } }, 'Plano Mensal'),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 13, marginBottom: 14 } }, 'Suas recargas serão acumuladas e cobradas na data escolhida.'),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 13, marginBottom: 6 } }, 'Dia de pagamento do mês:'),
            React.createElement(TextInput, {
              value: payDay,
              onChangeText: function(t) { setPayDay(t.replace(/[^0-9]/g, '')); },
              placeholder: '5',
              keyboardType: 'numeric',
              style: styles.input,
              componentId: 'input-pay-day'
            })
          ),
        React.createElement(TouchableOpacity, {
          onPress: handleConfirmPayment,
          disabled: loading,
          style: [styles.primaryButton, { marginTop: 24, opacity: loading ? 0.7 : 1 }],
          componentId: 'btn-confirm-payment'
        },
          loading
            ? React.createElement(ActivityIndicator, { color: '#FFFFFF', size: 'small' })
            : React.createElement(Text, { style: styles.primaryButtonText }, 'Confirmar Pagamento ✓')
        )
      )
    );
  };
  // @end:PaymentScreen

  // @section:ChargingMonitorScreen @depends:[ThemeContext,styles]
  var ChargingMonitorScreen = function(props) {
    var navigation = props.navigation;
    var route = props.route;
    var params = route && route.params ? route.params : {};
    var chargeId = params.chargeId || generateId();
    var totalKwh = params.kwh || 20;
    var totalCost = params.cost || 18;
    var totalDuration = params.duration || 162;
    var stationName = params.stationName || 'Estação';
    var paymentMethod = params.paymentMethod || 'Pix';
    var transactionId = params.transactionId || 'TXN-DEMO';
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var elapsedState = useState(0);
    var elapsed = elapsedState[0];
    var setElapsed = elapsedState[1];
    var kwhDeliveredState = useState(0);
    var kwhDelivered = kwhDeliveredState[0];
    var setKwhDelivered = kwhDeliveredState[1];
    var statusIdxState = useState(0);
    var statusIdx = statusIdxState[0];
    var setStatusIdx = statusIdxState[1];
    var doneState = useState(false);
    var done = doneState[0];
    var setDone = doneState[1];
    var updateCharge = useMutation('instant_charges', 'update');
    var mutateUpdate = updateCharge.mutate;
    var intervalRef = useRef(null);
    var STATUSES = ['preparing', 'charging', 'charging', 'nearly_complete', 'completed'];
    var STATUS_LABELS = ['Preparando...', 'Carregando', 'Carregando', 'Quase concluído', 'Concluído!'];
    var TOTAL_SIM_SECONDS = 30;
    var currentStatus = STATUSES[Math.min(statusIdx, STATUSES.length - 1)];
    var currentStatusLabel = STATUS_LABELS[Math.min(statusIdx, STATUS_LABELS.length - 1)];
    var progress = Math.min(elapsed / TOTAL_SIM_SECONDS, 1);
    var currentKwh = parseFloat((progress * totalKwh).toFixed(2));
    var currentCost = parseFloat((currentKwh * PRICE_PER_KWH).toFixed(2));
    var remainingSeconds = Math.max(0, TOTAL_SIM_SECONDS - elapsed);

    useEffect(function() {
      if (done) return;
      intervalRef.current = setInterval(function() {
        setElapsed(function(prev) {
          var next = prev + 1;
          var p = next / TOTAL_SIM_SECONDS;
          setKwhDelivered(parseFloat((p * totalKwh).toFixed(2)));
          var sIdx = Math.floor(p * (STATUSES.length - 1));
          setStatusIdx(Math.min(sIdx, STATUSES.length - 1));
          if (next >= TOTAL_SIM_SECONDS) {
            clearInterval(intervalRef.current);
            setDone(true);
            mutateUpdate({ id: chargeId, data: { status: 'completed', kwh_delivered: totalKwh, completed_at: new Date().toISOString() } }).catch(function() {});
          }
          return next;
        });
      }, 1000);
      return function() { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    if (done) {
      return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
        React.createElement(StatusBar, { backgroundColor: '#10B981', barStyle: 'light-content' }),
        React.createElement(ScrollView, {
          style: Platform.OS === 'web' ? { height: scrollH, overflow: 'auto' } : { flex: 1 },
          contentContainerStyle: { padding: 24, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40, alignItems: 'center' }
        },
          React.createElement(View, { style: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 } },
            React.createElement(Ionicons, { name: 'checkmark', size: 52, color: '#FFFFFF' })
          ),
          React.createElement(Text, { style: { fontSize: 24, fontWeight: '800', color: textPrimary, textAlign: 'center', marginBottom: 8 } }, 'Obrigada por utilizar\nnossas recargas!'),
          React.createElement(Text, { style: { color: textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 } }, 'Recarga concluída com sucesso!'),
          React.createElement(View, { style: [styles.card, { width: '100%', marginBottom: 24 }], componentId: 'complete-summary' },
            React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 16, marginBottom: 14 } }, 'Resumo da Recarga'),
            React.createElement(View, { style: styles.summaryRow },
              React.createElement(Text, { style: styles.summaryLabel }, 'Energia transferida'),
              React.createElement(Text, { style: styles.summaryValue }, totalKwh.toFixed(2) + ' KWh')
            ),
            React.createElement(View, { style: styles.summaryRow },
              React.createElement(Text, { style: styles.summaryLabel }, 'Tempo total'),
              React.createElement(Text, { style: styles.summaryValue }, Math.floor(totalDuration / 60) + 'h ' + (totalDuration % 60) + 'min')
            ),
            React.createElement(View, { style: styles.summaryRow },
              React.createElement(Text, { style: styles.summaryLabel }, 'Pagamento'),
              React.createElement(Text, { style: styles.summaryValue }, paymentMethod)
            ),
            React.createElement(View, { style: styles.summaryRow },
              React.createElement(Text, { style: styles.summaryLabel }, 'ID Transação'),
              React.createElement(Text, { style: { color: primaryColor, fontWeight: '600', fontSize: 12 } }, transactionId)
            ),
            React.createElement(View, { style: [styles.summaryRow, { borderTopWidth: 1.5, borderTopColor: '#E2E8F0', marginTop: 8, paddingTop: 12 }] },
              React.createElement(Text, { style: { fontWeight: '800', color: textPrimary, fontSize: 16 } }, 'Valor pago'),
              React.createElement(Text, { style: { fontWeight: '800', color: '#10B981', fontSize: 22 } }, formatCurrency(totalCost))
            )
          ),
          React.createElement(TouchableOpacity, { onPress: function() { navigation.navigate('NewCharge'); }, style: [styles.primaryButton, { width: '100%', marginBottom: 10 }], componentId: 'btn-new-charge-again' },
            React.createElement(Text, { style: styles.primaryButtonText }, 'Nova Recarga')
          ),
          React.createElement(TouchableOpacity, { onPress: function() { navigation.navigate('ScheduleStation'); }, style: [styles.secondaryButton, { width: '100%', marginBottom: 10 }], componentId: 'btn-schedule-from-complete' },
            React.createElement(Text, { style: styles.secondaryButtonText }, 'Agendar Recarga')
          ),
          React.createElement(TouchableOpacity, { onPress: function() { navigation.navigate('MainApp'); }, style: { paddingVertical: 14, alignItems: 'center' }, componentId: 'btn-home-from-complete' },
            React.createElement(Text, { style: { color: textSecondary, fontWeight: '600' } }, 'Voltar ao início')
          )
        )
      );
    }

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: primaryColor, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 16 } },
        React.createElement(Text, { style: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' } }, 'Recarga em Andamento'),
        React.createElement(Text, { style: { color: 'rgba(255,255,255,0.75)', fontSize: 13 } }, stationName)
      ),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH - 60, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 40, alignItems: 'center' }
      },
        React.createElement(View, { style: { width: 160, height: 160, borderRadius: 80, backgroundColor: primaryColor + '15', borderWidth: 8, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }, componentId: 'charge-circle' },
          React.createElement(Ionicons, { name: 'flash', size: 36, color: primaryColor }),
          React.createElement(Text, { style: { fontSize: 26, fontWeight: '800', color: primaryColor, marginTop: 4 } }, Math.round(progress * 100) + '%'),
          React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginTop: 2 } }, currentStatusLabel)
        ),
        React.createElement(View, { style: { width: '100%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 24 }, componentId: 'progress-bar' },
          React.createElement(View, { style: { width: (progress * 100) + '%', height: '100%', backgroundColor: primaryColor, borderRadius: 6 } })
        ),
        React.createElement(View, { style: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 } },
          React.createElement(View, { style: { flex: 1, backgroundColor: cardColor, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } },
            React.createElement(Ionicons, { name: 'time-outline', size: 24, color: primaryColor }),
            React.createElement(Text, { style: { fontWeight: '800', color: textPrimary, fontSize: 20, marginTop: 4 } }, formatTime(elapsed)),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 2 } }, 'Tempo decorrido')
          ),
          React.createElement(View, { style: { flex: 1, backgroundColor: cardColor, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } },
            React.createElement(Ionicons, { name: 'flash-outline', size: 24, color: accentColor }),
            React.createElement(Text, { style: { fontWeight: '800', color: textPrimary, fontSize: 20, marginTop: 4 } }, currentKwh.toFixed(1)),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 2 } }, 'KWh transferidos')
          )
        ),
        React.createElement(View, { style: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 } },
          React.createElement(View, { style: { flex: 1, backgroundColor: cardColor, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } },
            React.createElement(Ionicons, { name: 'cash-outline', size: 24, color: '#10B981' }),
            React.createElement(Text, { style: { fontWeight: '800', color: textPrimary, fontSize: 18, marginTop: 4 } }, formatCurrency(currentCost)),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 2 } }, 'Custo atual')
          ),
          React.createElement(View, { style: { flex: 1, backgroundColor: cardColor, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } },
            React.createElement(Ionicons, { name: 'timer-outline', size: 24, color: '#F59E0B' }),
            React.createElement(Text, { style: { fontWeight: '800', color: textPrimary, fontSize: 18, marginTop: 4 } }, formatTime(remainingSeconds)),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 2 } }, 'Tempo restante')
          )
        ),
        React.createElement(View, { style: [styles.card, { width: '100%' }], componentId: 'charge-status-card' },
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
            React.createElement(View, { style: { width: 12, height: 12, borderRadius: 6, backgroundColor: getStatusColor(currentStatus), marginRight: 8 } }),
            React.createElement(Text, { style: { fontWeight: '700', color: textPrimary } }, 'Status: ' + currentStatusLabel)
          ),
          React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 } },
            React.createElement(Text, { style: { color: textSecondary, fontSize: 13 } }, 'Meta: ' + totalKwh.toFixed(1) + ' KWh'),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 13 } }, 'Total: ' + formatCurrency(totalCost))
          )
        )
      )
    );
  };
  // @end:ChargingMonitorScreen

  // @section:ScheduleStationScreen @depends:[ThemeContext,styles]
  var ScheduleStationScreen = function(props) {
    var navigation = props.navigation;
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: primaryColor, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' } },
        React.createElement(TouchableOpacity, { onPress: function() { navigation.navigate('MainApp'); }, componentId: 'btn-back-sched' },
          React.createElement(Ionicons, { name: 'arrow-back', size: 24, color: '#FFFFFF' })
        ),
        React.createElement(Text, { style: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginLeft: 12 } }, 'Agendar Recarga')
      ),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH - 60, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 40 }
      },
        React.createElement(Text, { style: { fontSize: 16, fontWeight: '700', color: textPrimary, marginBottom: 14 } }, 'Escolha uma estação de carregamento'),
        CHARGING_STATIONS.map(function(st) {
          var available = st.status === 'operational' && st.available_chargers > 0;
          return React.createElement(TouchableOpacity, {
            key: st.id,
            onPress: function() {
              if (!available) {
                Platform.OS === 'web' ? window.alert('Esta estação não está disponível no momento.') : Alert.alert('Indisponível', 'Esta estação não está disponível no momento.');
                return;
              }
              navigation.navigate('ScheduleDateTime', { stationId: st.id, stationName: st.name, stationLocation: st.location, availableHours: st.hours });
            },
            style: [styles.card, { marginBottom: 12, opacity: available ? 1 : 0.5 }],
            componentId: 'sched-station-' + st.id
          },
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' } },
              React.createElement(View, { style: { flex: 1 } },
                React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 16 } }, st.name),
                React.createElement(Text, { style: { color: textSecondary, fontSize: 13, marginTop: 4 } }, st.location),
                React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 4 } }, st.charger_type)
              ),
              React.createElement(View, { style: { backgroundColor: available ? '#10B981' + '20' : '#EF4444' + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 10 } },
                React.createElement(Text, { style: { color: available ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: '600' } }, available ? st.available_chargers + ' livres' : st.status === 'maintenance' ? 'Manutenção' : 'Lotado')
              )
            ),
            React.createElement(View, { style: { flexDirection: 'row', marginTop: 10, gap: 16 } },
              React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
                React.createElement(Ionicons, { name: 'flash', size: 14, color: primaryColor }),
                React.createElement(Text, { style: { color: primaryColor, fontSize: 12, fontWeight: '600', marginLeft: 4 } }, st.total_chargers + ' carregadores')
              ),
              React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
                React.createElement(Ionicons, { name: 'time', size: 14, color: textSecondary }),
                React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginLeft: 4 } }, st.hours.length + ' horários')
              )
            )
          );
        })
      )
    );
  };
  // @end:ScheduleStationScreen

  // @section:ScheduleDateTimeScreen @depends:[ThemeContext,styles]
  var ScheduleDateTimeScreen = function(props) {
    var navigation = props.navigation;
    var route = props.route;
    var params = route && route.params ? route.params : {};
    var stationId = params.stationId || 'st-001';
    var stationName = params.stationName || 'Estação';
    var stationLocation = params.stationLocation || '';
    var availableHours = params.availableHours || ['08:00','09:00','10:00'];
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var todayStr = new Date().toISOString().split('T')[0];
    var dateState = useState(todayStr);
    var selectedDate = dateState[0];
    var setSelectedDate = dateState[1];
    var hourState = useState('');
    var selectedHour = hourState[0];
    var setSelectedHour = hourState[1];
    var kwhState = useState('20');
    var kwh = kwhState[0];
    var setKwh = kwhState[1];
    var durationState = useState('60');
    var duration = durationState[0];
    var setDuration = durationState[1];
    var modeState = useState('kwh');
    var mode = modeState[0];
    var setMode = modeState[1];
    var POWER_KW = 7.4;

    var calculatedKwh = useMemo(function() {
      if (mode === 'kwh') return parseFloat(kwh) || 0;
      return parseFloat(((parseFloat(duration) || 0) / 60 * POWER_KW).toFixed(2));
    }, [mode, kwh, duration]);

    var calculatedCost = useMemo(function() {
      return parseFloat((calculatedKwh * PRICE_PER_KWH).toFixed(2));
    }, [calculatedKwh]);

    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: primaryColor, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' } },
        React.createElement(TouchableOpacity, { onPress: function() { navigation.goBack(); }, componentId: 'btn-back-sched-dt' },
          React.createElement(Ionicons, { name: 'arrow-back', size: 24, color: '#FFFFFF' })
        ),
        React.createElement(View, { style: { marginLeft: 12 } },
          React.createElement(Text, { style: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' } }, 'Data e Horário'),
          React.createElement(Text, { style: { color: 'rgba(255,255,255,0.75)', fontSize: 12 } }, stationName)
        )
      ),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH - 60, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 80 }
      },
        React.createElement(View, { style: styles.card, componentId: 'date-card' },
          React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginBottom: 12 } }, 'Selecione a data'),
          Platform.OS === 'web'
            ? React.createElement('input', { type: 'date', value: selectedDate, min: todayStr, onChange: function(e) { setSelectedDate(e.target.value); }, style: { padding: 12, border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 16, width: '100%', boxSizing: 'border-box', color: textPrimary } })
            : React.createElement(TextInput, { value: selectedDate, onChangeText: setSelectedDate, placeholder: 'YYYY-MM-DD', style: styles.input, componentId: 'input-date' })
        ),
        React.createElement(View, { style: [styles.card, { marginTop: 14 }], componentId: 'time-card' },
          React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginBottom: 12 } }, 'Selecione o horário'),
          React.createElement(View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } },
            availableHours.map(function(h) {
              var sel = selectedHour === h;
              return React.createElement(TouchableOpacity, {
                key: h,
                onPress: function() { setSelectedHour(h); },
                style: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: sel ? primaryColor : backgroundColor, borderWidth: 1.5, borderColor: sel ? primaryColor : '#E2E8F0' },
                componentId: 'hour-' + h
              }, React.createElement(Text, { style: { color: sel ? '#FFFFFF' : textPrimary, fontWeight: '600' } }, h));
            })
          )
        ),
        React.createElement(View, { style: [styles.card, { marginTop: 14 }], componentId: 'kwh-card-sched' },
          React.createElement(View, { style: { flexDirection: 'row', backgroundColor: backgroundColor, borderRadius: 10, padding: 3, marginBottom: 14 } },
            React.createElement(TouchableOpacity, { onPress: function() { setMode('kwh'); }, style: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: mode === 'kwh' ? primaryColor : 'transparent', alignItems: 'center' }, componentId: 'sched-mode-kwh' },
              React.createElement(Text, { style: { color: mode === 'kwh' ? '#FFFFFF' : textSecondary, fontWeight: '600', fontSize: 13 } }, 'Por KWh')),
            React.createElement(TouchableOpacity, { onPress: function() { setMode('time'); }, style: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: mode === 'time' ? primaryColor : 'transparent', alignItems: 'center' }, componentId: 'sched-mode-time' },
              React.createElement(Text, { style: { color: mode === 'time' ? '#FFFFFF' : textSecondary, fontWeight: '600', fontSize: 13 } }, 'Por Duração'))
          ),
          mode === 'kwh'
            ? React.createElement(View, null,
              React.createElement(Text, { style: { color: textSecondary, fontSize: 13, marginBottom: 6 } }, 'Quantidade de KWh:'),
              React.createElement(TextInput, { value: kwh, onChangeText: function(t) { setKwh(t.replace(/[^0-9.]/g, '')); }, placeholder: '20', keyboardType: 'decimal-pad', style: styles.input, componentId: 'input-sched-kwh' })
            )
            : React.createElement(View, null,
              React.createElement(Text, { style: { color: textSecondary, fontSize: 13, marginBottom: 6 } }, 'Duração em minutos:'),
              React.createElement(TextInput, { value: duration, onChangeText: function(t) { setDuration(t.replace(/[^0-9]/g, '')); }, placeholder: '60', keyboardType: 'numeric', style: styles.input, componentId: 'input-sched-duration' })
            ),
          React.createElement(View, { style: { marginTop: 14, padding: 12, backgroundColor: primaryColor + '10', borderRadius: 10 } },
            React.createElement(View, { style: styles.summaryRow },
              React.createElement(Text, { style: styles.summaryLabel }, 'Energia'),
              React.createElement(Text, { style: styles.summaryValue }, calculatedKwh.toFixed(2) + ' KWh')
            ),
            React.createElement(View, { style: styles.summaryRow },
              React.createElement(Text, { style: { fontWeight: '800', color: textPrimary } }, 'Custo estimado'),
              React.createElement(Text, { style: { fontWeight: '800', color: primaryColor, fontSize: 18 } }, formatCurrency(calculatedCost))
            )
          )
        ),
        React.createElement(TouchableOpacity, {
          onPress: function() {
            if (!selectedHour) { Platform.OS === 'web' ? window.alert('Selecione um horário.') : Alert.alert('Atenção', 'Selecione um horário.'); return; }
            if (calculatedKwh <= 0) { Platform.OS === 'web' ? window.alert('Informe uma quantidade válida.') : Alert.alert('Atenção', 'Informe uma quantidade válida.'); return; }
            navigation.navigate('SchedulePayment', {
              stationId: stationId,
              stationName: stationName,
              stationLocation: stationLocation,
              scheduledDate: selectedDate,
              scheduledTime: selectedHour,
              kwh: calculatedKwh,
              duration: mode === 'time' ? (parseFloat(duration) || 60) : Math.round(calculatedKwh / POWER_KW * 60),
              cost: calculatedCost
            });
          },
          style: [styles.primaryButton, { marginTop: 20 }],
          componentId: 'btn-proceed-sched-payment'
        }, React.createElement(Text, { style: styles.primaryButtonText }, 'Escolher Pagamento →'))
      )
    );
  };
  // @end:ScheduleDateTimeScreen

  // @section:SchedulePaymentScreen @depends:[ThemeContext,styles]
  var SchedulePaymentScreen = function(props) {
    var navigation = props.navigation;
    var route = props.route;
    var params = route && route.params ? route.params : {};
    var stationId = params.stationId || 'st-001';
    var stationName = params.stationName || 'Estação';
    var stationLocation = params.stationLocation || '';
    var scheduledDate = params.scheduledDate || '';
    var scheduledTime = params.scheduledTime || '';
    var kwh = params.kwh || 20;
    var duration = params.duration || 162;
    var cost = params.cost || 18;
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var timingState = useState('advance');
    var timing = timingState[0];
    var setTiming = timingState[1];
    var payMethodState = useState('pix');
    var payMethod = payMethodState[0];
    var setPayMethod = payMethodState[1];
    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: primaryColor, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' } },
        React.createElement(TouchableOpacity, { onPress: function() { navigation.goBack(); }, componentId: 'btn-back-sched-pay' },
          React.createElement(Ionicons, { name: 'arrow-back', size: 24, color: '#FFFFFF' })
        ),
        React.createElement(Text, { style: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginLeft: 12 } }, 'Pagamento do Agendamento')
      ),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH - 60, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 80 }
      },
        React.createElement(View, { style: [styles.card, { marginBottom: 16 }], componentId: 'sched-summary' },
          React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginBottom: 12 } }, 'Resumo do Agendamento'),
          React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Estação'), React.createElement(Text, { style: styles.summaryValue }, stationName)),
          React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Data'), React.createElement(Text, { style: styles.summaryValue }, formatDate(scheduledDate))),
          React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Horário'), React.createElement(Text, { style: styles.summaryValue }, scheduledTime)),
          React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'KWh'), React.createElement(Text, { style: styles.summaryValue }, kwh.toFixed(2) + ' KWh')),
          React.createElement(View, { style: [styles.summaryRow, { borderTopWidth: 1.5, borderTopColor: '#E2E8F0', marginTop: 8, paddingTop: 12 }] },
            React.createElement(Text, { style: { fontWeight: '800', color: textPrimary, fontSize: 15 } }, 'Valor'),
            React.createElement(Text, { style: { fontWeight: '800', color: primaryColor, fontSize: 20 } }, formatCurrency(cost))
          )
        ),
        React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginBottom: 12 } }, 'Como deseja pagar?'),
        React.createElement(TouchableOpacity, {
          onPress: function() { setTiming('advance'); },
          style: [styles.card, { marginBottom: 10, borderWidth: 2, borderColor: timing === 'advance' ? primaryColor : 'transparent' }],
          componentId: 'timing-advance'
        },
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
            React.createElement(View, { style: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: timing === 'advance' ? primaryColor : '#CBD5E0', backgroundColor: timing === 'advance' ? primaryColor : 'transparent', marginRight: 12 } }),
            React.createElement(View, null,
              React.createElement(Text, { style: { fontWeight: '700', color: textPrimary } }, 'Pagar antecipadamente'),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 2 } }, 'Pagamento confirmado agora')
            )
          )
        ),
        React.createElement(TouchableOpacity, {
          onPress: function() { setTiming('at_station'); },
          style: [styles.card, { marginBottom: 16, borderWidth: 2, borderColor: timing === 'at_station' ? primaryColor : 'transparent' }],
          componentId: 'timing-station'
        },
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
            React.createElement(View, { style: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: timing === 'at_station' ? primaryColor : '#CBD5E0', backgroundColor: timing === 'at_station' ? primaryColor : 'transparent', marginRight: 12 } }),
            React.createElement(View, null,
              React.createElement(Text, { style: { fontWeight: '700', color: textPrimary } }, 'Pagar no momento da recarga'),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 2 } }, 'Pagamento pendente')
            )
          )
        ),
        timing === 'advance'
          ? React.createElement(View, { componentId: 'advance-methods' },
            React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 14, marginBottom: 10 } }, 'Método:'),
            PAYMENT_METHODS.map(function(m) {
              var sel = payMethod === m.value;
              return React.createElement(TouchableOpacity, {
                key: m.value,
                onPress: function() { setPayMethod(m.value); },
                style: [styles.card, { marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: sel ? primaryColor : 'transparent' }],
                componentId: 'sched-method-' + m.value
              },
                React.createElement(View, { style: { width: 36, height: 36, borderRadius: 18, backgroundColor: sel ? primaryColor : backgroundColor, alignItems: 'center', justifyContent: 'center', marginRight: 10 } },
                  React.createElement(Ionicons, { name: m.icon, size: 18, color: sel ? '#FFFFFF' : textSecondary })
                ),
                React.createElement(Text, { style: { fontWeight: '600', color: sel ? primaryColor : textPrimary } }, m.label),
                sel ? React.createElement(View, { style: { marginLeft: 'auto' } }, React.createElement(Ionicons, { name: 'checkmark-circle', size: 20, color: primaryColor })) : null
              );
            })
          )
          : null,
        React.createElement(TouchableOpacity, {
          onPress: function() {
            navigation.navigate('ScheduleReminder', {
              stationId: stationId,
              stationName: stationName,
              stationLocation: stationLocation,
              scheduledDate: scheduledDate,
              scheduledTime: scheduledTime,
              kwh: kwh,
              duration: duration,
              cost: cost,
              paymentTiming: timing,
              paymentMethod: timing === 'at_station' ? 'pending' : payMethod
            });
          },
          style: [styles.primaryButton, { marginTop: 16 }],
          componentId: 'btn-proceed-reminder'
        }, React.createElement(Text, { style: styles.primaryButtonText }, 'Configurar Lembrete →'))
      )
    );
  };
  // @end:SchedulePaymentScreen

  // @section:ScheduleReminderScreen @depends:[ThemeContext,styles]
  var ScheduleReminderScreen = function(props) {
    var navigation = props.navigation;
    var route = props.route;
    var params = route && route.params ? route.params : {};
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var reminderState = useState('none');
    var reminder = reminderState[0];
    var setReminder = reminderState[1];
    var loadingState = useState(false);
    var loading = loadingState[0];
    var setLoading = loadingState[1];
    var userState = useStorage('currentUser', null);
    var currentUser = userState[0];
    var insertSession = useMutation('scheduled_sessions', 'insert');
    var mutateSession = insertSession.mutate;
    var pushHook = usePushNotifications();
    var isSupported = pushHook.isSupported;
    var requestPermission = pushHook.requestPermission;
    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    var handleConfirm = function() {
      setLoading(true);
      var sessionId = generateId();
      var userId = currentUser ? currentUser.id : 'demo-001';
      var stId = params.stationId || 'st-001';
      var kwhVal = params.kwh || 20;
      var costVal = params.cost || 18;
      var goodweShare = parseFloat((costVal * 0.10).toFixed(2));
      var venueShare = parseFloat((costVal * 0.90).toFixed(2));
      var qrD = generateQRData(userId, stId, kwhVal, costVal, 'scheduled');
      mutateSession({
        id: sessionId,
        user_id: userId,
        station_id: stId,
        scheduled_date: params.scheduledDate || new Date().toISOString().split('T')[0],
        scheduled_time: params.scheduledTime || '10:00',
        kwh_requested: kwhVal,
        duration_minutes: params.duration || 162,
        estimated_cost: costVal,
        payment_method: params.paymentMethod || 'pix',
        payment_timing: params.paymentTiming || 'advance',
        payment_status: params.paymentTiming === 'at_station' ? 'pending' : 'completed',
        reminder_option: reminder,
        reminder_sent: false,
        status: 'scheduled',
        qr_code_data: qrD,
        goodwe_share: goodweShare,
        venue_share: venueShare
      }).then(function() {
        setLoading(false);
        if (isSupported && reminder !== 'none') {
          requestPermission().then(function() {}).catch(function() {});
        }
        navigation.navigate('ScheduleConfirm', Object.assign({}, params, { sessionId: sessionId, qrData: qrD, reminder: reminder }));
      }).catch(function() {
        setLoading(false);
        navigation.navigate('ScheduleConfirm', Object.assign({}, params, { sessionId: sessionId, qrData: qrD, reminder: reminder }));
      });
    };

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: primaryColor, barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: primaryColor, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' } },
        React.createElement(TouchableOpacity, { onPress: function() { navigation.goBack(); }, componentId: 'btn-back-reminder' },
          React.createElement(Ionicons, { name: 'arrow-back', size: 24, color: '#FFFFFF' })
        ),
        React.createElement(Text, { style: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginLeft: 12 } }, 'Configurar Lembrete')
      ),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH - 60, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 80 }
      },
        React.createElement(View, { style: { alignItems: 'center', marginBottom: 24 }, componentId: 'reminder-icon' },
          React.createElement(View, { style: { width: 72, height: 72, borderRadius: 36, backgroundColor: primaryColor + '18', alignItems: 'center', justifyContent: 'center' } },
            React.createElement(Ionicons, { name: 'notifications', size: 36, color: primaryColor })
          ),
          React.createElement(Text, { style: { fontSize: 16, fontWeight: '700', color: textPrimary, marginTop: 12 } }, 'Você deseja receber um lembrete?'),
          React.createElement(Text, { style: { color: textSecondary, fontSize: 13, textAlign: 'center', marginTop: 4 } }, 'Selecione quando deseja ser notificado sobre sua recarga agendada.')
        ),
        REMINDER_OPTIONS.map(function(opt) {
          var sel = reminder === opt.value;
          return React.createElement(TouchableOpacity, {
            key: opt.value,
            onPress: function() { setReminder(opt.value); },
            style: [styles.card, { marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: sel ? primaryColor : 'transparent' }],
            componentId: 'reminder-' + opt.value
          },
            React.createElement(View, { style: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: sel ? primaryColor : '#CBD5E0', backgroundColor: sel ? primaryColor : 'transparent', marginRight: 12, alignItems: 'center', justifyContent: 'center' } },
              sel ? React.createElement(Ionicons, { name: 'checkmark', size: 12, color: '#FFFFFF' }) : null
            ),
            React.createElement(Text, { style: { fontWeight: sel ? '700' : '500', color: sel ? primaryColor : textPrimary, fontSize: 15 } }, opt.label)
          );
        }),
        React.createElement(TouchableOpacity, {
          onPress: handleConfirm,
          disabled: loading,
          style: [styles.primaryButton, { marginTop: 20, opacity: loading ? 0.7 : 1 }],
          componentId: 'btn-confirm-sched'
        },
          loading
            ? React.createElement(ActivityIndicator, { color: '#FFFFFF', size: 'small' })
            : React.createElement(Text, { style: styles.primaryButtonText }, 'Confirmar Agendamento ✓')
        )
      )
    );
  };
  // @end:ScheduleReminderScreen

  // @section:ScheduleConfirmScreen @depends:[ThemeContext,styles,QRCodeVisual]
  var ScheduleConfirmScreen = function(props) {
    var navigation = props.navigation;
    var route = props.route;
    var params = route && route.params ? route.params : {};
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var qrData = params.qrData || { code: 'QR-DEMO' };
    var reminder = params.reminder || 'none';
    var reminderLabel = REMINDER_OPTIONS.find(function(r) { return r.value === reminder; });
    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: '#10B981', barStyle: 'light-content' }),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { padding: 24, paddingTop: insets.top + 30, paddingBottom: insets.bottom + 40, alignItems: 'center' }
      },
        React.createElement(View, { style: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 } },
          React.createElement(Ionicons, { name: 'calendar-outline', size: 40, color: '#FFFFFF' })
        ),
        React.createElement(Text, { style: { fontSize: 24, fontWeight: '800', color: textPrimary, textAlign: 'center', marginBottom: 8 } }, 'Recarga Agendada!'),
        React.createElement(Text, { style: { color: textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 } }, 'Seu agendamento foi confirmado com sucesso.'),
        React.createElement(View, { style: [styles.card, { width: '100%', marginBottom: 16 }], componentId: 'confirm-summary' },
          React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginBottom: 12 } }, 'Detalhes do Agendamento'),
          React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Estação'), React.createElement(Text, { style: styles.summaryValue }, params.stationName || 'Estação')),
          React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Data'), React.createElement(Text, { style: styles.summaryValue }, formatDate(params.scheduledDate || ''))),
          React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Horário'), React.createElement(Text, { style: styles.summaryValue }, params.scheduledTime || '')),
          React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Energia'), React.createElement(Text, { style: styles.summaryValue }, (params.kwh || 0).toFixed(2) + ' KWh')),
          React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Valor'), React.createElement(Text, { style: { fontWeight: '800', color: primaryColor, fontSize: 18 } }, formatCurrency(params.cost || 0))),
          React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Lembrete'), React.createElement(Text, { style: styles.summaryValue }, reminderLabel ? reminderLabel.label : 'Sem lembrete'))
        ),
        React.createElement(View, { style: [styles.card, { width: '100%', alignItems: 'center', marginBottom: 20 }], componentId: 'confirm-qr' },
          React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, marginBottom: 14 } }, 'QR Code do Agendamento'),
          React.createElement(QRCodeVisual, { size: 180, code: qrData.code }),
          React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginTop: 8 } }, 'Código: ' + qrData.code)
        ),
        React.createElement(TouchableOpacity, {
          onPress: function() { navigation.navigate('MainApp'); },
          style: [styles.primaryButton, { width: '100%', marginBottom: 10 }],
          componentId: 'btn-home-from-sched'
        }, React.createElement(Text, { style: styles.primaryButtonText }, 'Voltar ao Início')),
        React.createElement(TouchableOpacity, {
          onPress: function() { navigation.navigate('NewCharge'); },
          style: [styles.secondaryButton, { width: '100%' }],
          componentId: 'btn-new-from-sched'
        }, React.createElement(Text, { style: styles.secondaryButtonText }, 'Nova Recarga'))
      )
    );
  };
  // @end:ScheduleConfirmScreen

  // @section:AdminDashboardScreen @depends:[ThemeContext,styles]
  var AdminDashboardScreen = function(props) {
    var navigation = props.navigation;
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var userState = useStorage('currentUser', null);
    var currentUser = userState[0];
    var setCurrentUser = userState[1];
    var chargesQuery = useQuery('instant_charges');
    var charges = chargesQuery.data;
    var sessionsQuery = useQuery('scheduled_sessions');
    var sessions = sessionsQuery.data;
    var paymentsQuery = useQuery('payments');
    var payments = paymentsQuery.data;
    var profilesQuery = useQuery('profiles');
    var profiles = profilesQuery.data;
    var qrLogsQuery = useQuery('qr_code_logs');
    var qrLogs = qrLogsQuery.data;
    var tabState = useState('dashboard');
    var activeTab = tabState[0];
    var setActiveTab = tabState[1];
    var sensorConnectedState = useState(false);
    var sensorConnected = sensorConnectedState[0];
    var setSensorConnected = sensorConnectedState[1];
    var sensorKwhState = useState(0);
    var sensorKwh = sensorKwhState[0];
    var setSensorKwh = sensorKwhState[1];
    var sensorStatusState = useState('Desconectado');
    var sensorStatus = sensorStatusState[0];
    var setSensorStatus = sensorStatusState[1];
    var sensorsHook = useSensors();
    var accelerometer = sensorsHook.accelerometer;
    var startAccelerometer = sensorsHook.startAccelerometer;
    var stopAccelerometer = sensorsHook.stopAccelerometer;

    useEffect(function() {
      if (activeTab === 'sensor') {
        startAccelerometer();
        return function() { stopAccelerometer(); };
      }
    }, [activeTab]);

    var totalCharged = useMemo(function() {
      if (!charges) return 0;
      return charges.filter(function(c) { return c.status === 'completed'; }).reduce(function(sum, c) { return sum + (c.kwh_delivered || 0); }, 0);
    }, [charges]);

    var totalRevenue = useMemo(function() {
      if (!payments) return 0;
      return payments.filter(function(p) { return p.payment_status === 'completed'; }).reduce(function(sum, p) { return sum + (p.amount || 0); }, 0);
    }, [payments]);

    var goodweTotal = useMemo(function() {
      if (!payments) return 0;
      return payments.filter(function(p) { return p.payment_status === 'completed'; }).reduce(function(sum, p) { return sum + (p.goodwe_share_amount || 0); }, 0);
    }, [payments]);

    var venueTotal = useMemo(function() {
      if (!payments) return 0;
      return payments.filter(function(p) { return p.payment_status === 'completed'; }).reduce(function(sum, p) { return sum + (p.venue_share_amount || 0); }, 0);
    }, [payments]);

    var TABS = [
      { key: 'dashboard', label: 'Dashboard', icon: 'bar-chart' },
      { key: 'charges', label: 'Recargas', icon: 'flash' },
      { key: 'qr', label: 'QR Logs', icon: 'qr-code' },
      { key: 'sensor', label: 'Sensor', icon: 'hardware-chip' },
    ];

    var scrollH = Dimensions.get('window').height - insets.top - insets.bottom;

    var renderDashboard = function() {
      var STATS = [
        { label: 'Usuários', value: String((profiles ? profiles.length : 0) + 2), color: primaryColor },
        { label: 'Recargas', value: String(charges ? charges.filter(function(c) { return c.status === 'completed'; }).length : 0), color: accentColor },
        { label: 'KWh Total', value: totalCharged.toFixed(1), color: '#10B981' },
        { label: 'Receita Total', value: formatCurrency(totalRevenue), color: '#8B5CF6' },
        { label: 'Agendamentos', value: String(sessions ? sessions.filter(function(s) { return s.status === 'scheduled'; }).length : 0), color: '#F59E0B' },
        { label: 'GoodWe (10%)', value: formatCurrency(goodweTotal), color: '#EF4444' },
        { label: 'Estabelec. (90%)', value: formatCurrency(venueTotal), color: '#06B6D4' },
      ];
      return React.createElement(View, null,
        React.createElement(View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, componentId: 'admin-stats' },
          STATS.map(function(s, i) {
            return React.createElement(View, { key: String(i), style: { width: '47%', backgroundColor: cardColor, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } },
              React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginBottom: 4 } }, s.label),
              React.createElement(Text, { style: { fontSize: 18, fontWeight: '800', color: s.color } }, s.value)
            );
          })
        ),
        React.createElement(View, { style: [styles.card, { marginTop: 16 }], componentId: 'revenue-split' },
          React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginBottom: 12 } }, 'Divisão de Receita'),
          React.createElement(View, { style: { height: 20, borderRadius: 10, backgroundColor: '#E2E8F0', overflow: 'hidden', flexDirection: 'row', marginBottom: 12 } },
            React.createElement(View, { style: { width: '10%', backgroundColor: '#EF4444' } }),
            React.createElement(View, { style: { width: '90%', backgroundColor: '#10B981' } })
          ),
          React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
            React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
              React.createElement(View, { style: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', marginRight: 6 } }),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 13 } }, 'GoodWe 10% - ' + formatCurrency(goodweTotal))
            ),
            React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
              React.createElement(View, { style: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', marginRight: 6 } }),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 13 } }, 'Estab. 90% - ' + formatCurrency(venueTotal))
            )
          )
        )
      );
    };

    var renderCharges = function() {
      if (!charges || charges.length === 0) {
        return React.createElement(View, { style: { alignItems: 'center', paddingVertical: 40 } },
          React.createElement(Text, { style: { color: textSecondary } }, 'Nenhuma recarga registrada')
        );
      }
      return React.createElement(View, null,
        React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, marginBottom: 12 } }, 'Todas as Recargas (' + charges.length + ')'),
        charges.slice().reverse().map(function(c) {
          var st = CHARGING_STATIONS.find(function(s) { return s.id === c.station_id; }) || { name: 'Estação' };
          return React.createElement(View, { key: c.id, style: [styles.card, { marginBottom: 8 }], componentId: 'admin-charge-' + c.id },
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 } },
              React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 13 } }, st.name),
              React.createElement(View, { style: { backgroundColor: getStatusColor(c.status) + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 } },
                React.createElement(Text, { style: { color: getStatusColor(c.status), fontSize: 11, fontWeight: '600' } }, getStatusLabel(c.status))
              )
            ),
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
              React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'KWh: ' + (c.kwh_delivered || 0).toFixed(1)),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'Valor: ' + formatCurrency(c.total_cost)),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, c.payment_method || '-')
            ),
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 } },
              React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, 'GoodWe: ' + formatCurrency(c.goodwe_share || 0)),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, 'Estab.: ' + formatCurrency(c.venue_share || 0))
            )
          );
        })
      );
    };

    var renderQRLogs = function() {
      if (!qrLogs || qrLogs.length === 0) {
        return React.createElement(View, { style: { alignItems: 'center', paddingVertical: 40 } },
          React.createElement(Text, { style: { color: textSecondary } }, 'Nenhum log de QR Code')
        );
      }
      return React.createElement(View, null,
        React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, marginBottom: 12 } }, 'Logs de QR Code (' + qrLogs.length + ')'),
        qrLogs.slice().reverse().map(function(log) {
          var st = CHARGING_STATIONS.find(function(s) { return s.id === log.station_id; }) || { name: 'Estação' };
          return React.createElement(View, { key: log.id, style: [styles.card, { marginBottom: 8 }], componentId: 'qr-log-' + log.id },
            React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 13, marginBottom: 6 } }, log.qr_code_value || 'QR-CODE'),
            React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'Estação:'), React.createElement(Text, { style: { color: textPrimary, fontSize: 11, fontWeight: '600' } }, st.name)),
            React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'KWh:'), React.createElement(Text, { style: { color: textPrimary, fontSize: 11, fontWeight: '600' } }, (log.kwh_value || 0).toFixed(2))),
            React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'Valor:'), React.createElement(Text, { style: { color: textPrimary, fontSize: 11, fontWeight: '600' } }, formatCurrency(log.cost_value || 0)))
          );
        })
      );
    };

    var renderSensor = function() {
      var accelData = accelerometer;
      return React.createElement(View, null,
        React.createElement(View, { style: [styles.card, { marginBottom: 14 }], componentId: 'sensor-status' },
          React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginBottom: 12 } }, 'Status da Estação (Simulado)'),
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 } },
            React.createElement(View, { style: { width: 12, height: 12, borderRadius: 6, backgroundColor: sensorConnected ? '#10B981' : '#9CA3AF', marginRight: 8 } }),
            React.createElement(Text, { style: { fontWeight: '600', color: textPrimary } }, sensorStatus)
          ),
          sensorConnected
            ? React.createElement(View, null,
              React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Veículo conectado'), React.createElement(Text, { style: { color: '#10B981', fontWeight: '600' } }, 'Sim')),
              React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'KWh transferidos'), React.createElement(Text, { style: styles.summaryValue }, sensorKwh.toFixed(2) + ' KWh')),
              React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Potência atual'), React.createElement(Text, { style: styles.summaryValue }, '7.4 kW'))
            )
            : null
        ),
        accelData
          ? React.createElement(View, { style: [styles.card, { marginBottom: 14 }], componentId: 'accelerometer-data' },
            React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 14, marginBottom: 10 } }, 'Acelerômetro (dados reais)'),
            React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'X'), React.createElement(Text, { style: styles.summaryValue }, (accelData.x || 0).toFixed(3) + ' g')),
            React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Y'), React.createElement(Text, { style: styles.summaryValue }, (accelData.y || 0).toFixed(3) + ' g')),
            React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.summaryLabel }, 'Z'), React.createElement(Text, { style: styles.summaryValue }, (accelData.z || 0).toFixed(3) + ' g'))
          )
          : null,
        React.createElement(Text, { style: { fontWeight: '700', color: textPrimary, fontSize: 15, marginBottom: 12 } }, 'Ferramentas de Simulação'),
        React.createElement(View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } },
          React.createElement(TouchableOpacity, {
            onPress: function() { setSensorConnected(true); setSensorStatus('Conectado - Carregando'); setSensorKwh(0); },
            style: [styles.primaryButton, { paddingHorizontal: 12, paddingVertical: 10 }],
            componentId: 'btn-connect-station'
          }, React.createElement(Text, { style: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 } }, '⚡ Conectar Estação')),
          React.createElement(TouchableOpacity, {
            onPress: function() { if (sensorConnected) { setSensorStatus('Carregando...'); } },
            style: [styles.secondaryButton, { paddingHorizontal: 12, paddingVertical: 10 }],
            componentId: 'btn-start-charge'
          }, React.createElement(Text, { style: { color: primaryColor, fontWeight: '700', fontSize: 12 } }, '▶ Iniciar Carga')),
          React.createElement(TouchableOpacity, {
            onPress: function() { setSensorKwh(function(prev) { return parseFloat((prev + 1.5).toFixed(2)); }); },
            style: [styles.secondaryButton, { paddingHorizontal: 12, paddingVertical: 10 }],
            componentId: 'btn-add-kwh'
          }, React.createElement(Text, { style: { color: primaryColor, fontWeight: '700', fontSize: 12 } }, '+ 1.5 KWh')),
          React.createElement(TouchableOpacity, {
            onPress: function() { setSensorConnected(false); setSensorStatus('Desconectado'); setSensorKwh(0); },
            style: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FEE2E2', borderWidth: 1.5, borderColor: '#EF4444' },
            componentId: 'btn-end-charge'
          }, React.createElement(Text, { style: { color: '#EF4444', fontWeight: '700', fontSize: 12 } }, '■ Finalizar'))
        )
      );
    };

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor } },
      React.createElement(StatusBar, { backgroundColor: '#1E3A5F', barStyle: 'light-content' }),
      React.createElement(View, { style: { backgroundColor: '#1E3A5F', paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement(View, null,
          React.createElement(Text, { style: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' } }, '⚙ Área Admin'),
          React.createElement(Text, { style: { color: 'rgba(255,255,255,0.7)', fontSize: 12 } }, 'Laura Pícari')
        ),
        React.createElement(TouchableOpacity, {
          onPress: function() { setCurrentUser(null); navigation.replace('Login'); },
          componentId: 'btn-admin-logout'
        }, React.createElement(Ionicons, { name: 'log-out-outline', size: 24, color: 'rgba(255,255,255,0.8)' }))
      ),
      React.createElement(ScrollView, {
        style: { flexGrow: 'initial' },
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 }
      },
        TABS.map(function(t) {
          var sel = activeTab === t.key;
          return React.createElement(TouchableOpacity, {
            key: t.key,
            onPress: function() { setActiveTab(t.key); },
            style: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: sel ? primaryColor : cardColor, borderWidth: 1, borderColor: sel ? primaryColor : '#E2E8F0' },
            componentId: 'admin-tab-' + t.key
          },
            React.createElement(Ionicons, { name: t.icon, size: 16, color: sel ? '#FFFFFF' : textSecondary }),
            React.createElement(Text, { style: { color: sel ? '#FFFFFF' : textSecondary, fontWeight: '600', fontSize: 13, marginLeft: 6 } }, t.label)
          );
        })
      ),
      React.createElement(ScrollView, {
        style: Platform.OS === 'web' ? { height: scrollH - 130, overflow: 'auto' } : { flex: 1 },
        contentContainerStyle: { padding: 16, paddingBottom: insets.bottom + 20 }
      },
        activeTab === 'dashboard' ? renderDashboard() :
        activeTab === 'charges' ? renderCharges() :
        activeTab === 'qr' ? renderQRLogs() :
        renderSensor()
      )
    );
  };
  // @end:AdminDashboardScreen

  // @section:TabNavigator @depends:[HomeScreen,HistoryScreen,navigation-setup]
  var MainTabNavigator = function() {
    var insets = useSafeAreaInsets();
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    return React.createElement(View, { style: { flex: 1, width: '100%', height: '100%', overflow: 'hidden' } },
      React.createElement(Tab.Navigator, {
        screenOptions: {
          headerShown: false,
          tabBarStyle: { position: 'absolute', bottom: 0, height: Platform.OS === 'web' ? TAB_MENU_HEIGHT : TAB_MENU_HEIGHT + insets.bottom, paddingBottom: 0, borderTopWidth: 0, backgroundColor: theme.colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 10 },
          tabBarItemStyle: { padding: 0 },
          tabBarActiveTintColor: primaryColor,
          tabBarInactiveTintColor: textSecondary
        }
      },
        React.createElement(Tab.Screen, {
          name: 'Início',
          component: HomeScreen,
          options: {
            tabBarIcon: function(p) { return React.createElement(Ionicons, { name: p.focused ? 'home' : 'home-outline', size: 24, color: p.color }); }
          }
        }),
        React.createElement(Tab.Screen, {
          name: 'Histórico',
          component: HistoryScreen,
          options: {
            tabBarIcon: function(p) { return React.createElement(Ionicons, { name: p.focused ? 'time' : 'time-outline', size: 24, color: p.color }); }
          }
        })
      )
    );
  };
  // @end:TabNavigator

  // @section:styles @depends:[theme]
  const styles = StyleSheet.create({
    card: {
      backgroundColor: cardColor,
      borderRadius: 14,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 3,
    },
    infoCard: {
      backgroundColor: cardColor,
      borderRadius: 14,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    input: {
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      backgroundColor: '#FAFBFC',
      color: textPrimary,
    },
    primaryButton: {
      backgroundColor: primaryColor,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: primaryColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryButton: {
      backgroundColor: cardColor,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: primaryColor,
    },
    secondaryButtonText: {
      color: primaryColor,
      fontSize: 16,
      fontWeight: '700',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 5,
    },
    summaryLabel: {
      color: textSecondary,
      fontSize: 13,
    },
    summaryValue: {
      color: textPrimary,
      fontWeight: '700',
      fontSize: 14,
    },
  });
  // @end:styles

  // @section:return @depends:[ThemeProvider,MainTabNavigator,AdminDashboardScreen,LoginScreen,RegisterScreen,NewChargeScreen,QRStationScreen,PaymentScreen,ChargingMonitorScreen,ScheduleStationScreen,ScheduleDateTimeScreen,SchedulePaymentScreen,ScheduleReminderScreen,ScheduleConfirmScreen]
  return React.createElement(ThemeProvider, null,
    React.createElement(View, { style: { flex: 1, width: '100%', height: '100%' } },
      React.createElement(Stack.Navigator, {
        screenOptions: { headerShown: false, cardStyle: { backgroundColor: backgroundColor } },
        initialRouteName: 'Login'
      },
        React.createElement(Stack.Screen, { name: 'Login', component: LoginScreen }),
        React.createElement(Stack.Screen, { name: 'Register', component: RegisterScreen }),
        React.createElement(Stack.Screen, { name: 'MainApp', component: MainTabNavigator }),
        React.createElement(Stack.Screen, { name: 'AdminDashboard', component: AdminDashboardScreen }),
        React.createElement(Stack.Screen, { name: 'NewCharge', component: NewChargeScreen }),
        React.createElement(Stack.Screen, { name: 'QRStation', component: QRStationScreen, initialParams: { kwh: 20, cost: 18, duration: 162 } }),
        React.createElement(Stack.Screen, { name: 'Payment', component: PaymentScreen, initialParams: { kwh: 20, cost: 18, duration: 162, stationId: 'st-001', stationName: 'Estação' } }),
        React.createElement(Stack.Screen, { name: 'ChargingMonitor', component: ChargingMonitorScreen, initialParams: { kwh: 20, cost: 18, duration: 162, stationName: 'Estação', paymentMethod: 'Pix', transactionId: 'TXN-DEMO' } }),
        React.createElement(Stack.Screen, { name: 'ScheduleStation', component: ScheduleStationScreen }),
        React.createElement(Stack.Screen, { name: 'ScheduleDateTime', component: ScheduleDateTimeScreen, initialParams: { stationId: 'st-001', stationName: 'Estação', stationLocation: '', availableHours: ['08:00','09:00','10:00'] } }),
        React.createElement(Stack.Screen, { name: 'SchedulePayment', component: SchedulePaymentScreen, initialParams: { stationId: 'st-001', stationName: 'Estação', scheduledDate: '', scheduledTime: '', kwh: 20, duration: 162, cost: 18 } }),
        React.createElement(Stack.Screen, { name: 'ScheduleReminder', component: ScheduleReminderScreen, initialParams: { stationId: 'st-001', stationName: 'Estação', scheduledDate: '', scheduledTime: '', kwh: 20, duration: 162, cost: 18, paymentTiming: 'advance', paymentMethod: 'pix' } }),
        React.createElement(Stack.Screen, { name: 'ScheduleConfirm', component: ScheduleConfirmScreen, initialParams: { stationName: 'Estação', scheduledDate: '', scheduledTime: '', kwh: 20, cost: 18, reminder: 'none' } })
      )
    )
  );
  // @end:return
};
return ComponentFunction;
