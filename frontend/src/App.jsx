import { useState, useEffect, useMemo } from 'react';
import * as api from './api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [view, setView] = useState('tables'); // tables | products
  const [productSearch, setProductSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('all'); // all | open | closed
  const [periodFilter, setPeriodFilter] = useState('hoje'); // hoje | semana | mes | tudo
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Table form state
  const [newTable, setNewTable] = useState({ customer_name: '', table_number: '' });

  // Product form state
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock_quantity: '', category: '' });
  const [productPhoto, setProductPhoto] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

  // Modal state
  const [activeTable, setActiveTable] = useState(null);
  const [checkoutTable, setCheckoutTable] = useState(null);
  const [checkoutPayment, setCheckoutPayment] = useState('');
  const [viewTable, setViewTable] = useState(null);
  const [addItemData, setAddItemData] = useState({ product_id: '', quantity: 1 });
  const [productToDelete, setProductToDelete] = useState(null);
  const [showQR, setShowQR] = useState(false);

  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');

  const isMenuPage = window.location.pathname === '/cardapio';

  useEffect(() => {
    if (isMenuPage) {
      const fetchPublicMenu = async () => {
        try {
          setProducts(await api.getProducts());
          setCategories(await api.getCategories());
        } catch (e) {
          console.error("Failed to load public menu", e);
        }
      };
      fetchPublicMenu();
    } else if (token) {
      fetchData();
    }
  }, [token, isMenuPage]);

  const fetchData = async () => {
    try {
      const user = await api.getMe();
      setCurrentUser(user);

      setProducts(await api.getProducts());
      setCategories(await api.getCategories());
      setTables(await api.getTables());
    } catch (e) {
      if (e.message.includes('401') || e.message.includes('403') || e.message.includes('Unauthorized')) {
        logout();
      }
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await api.login(authForm.username, authForm.password);
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setView('tables');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    try {
      await api.register(authForm.username, authForm.password);
      alert('Conta criada com sucesso!');
      setAuthForm({ username: '', password: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setView('tables');
    setCurrentUser(null);
  };

  const [newCategoryName, setNewCategoryName] = useState('');
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    await api.createCategory({ name: newCategoryName });
    setNewCategoryName('');
    fetchData();
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    await api.createTable(newTable);
    setNewTable({ customer_name: '', table_number: '' });
    fetchData();
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('price', newProduct.price);
    formData.append('stock_quantity', newProduct.stock_quantity);
    if (newProduct.category) {
      formData.append('category', newProduct.category);
    }
    if (productPhoto) {
      formData.append('photo', productPhoto);
    }

    await api.createProduct(formData);
    setNewProduct({ name: '', price: '', stock_quantity: '', category: '' });
    setProductPhoto(null);
    fetchData();
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', editProduct.name);
    formData.append('price', editProduct.price);
    formData.append('stock_quantity', editProduct.stock_quantity);
    if (editProduct.category) {
      formData.append('category', editProduct.category);
    } else {
      formData.append('category', '');
    }
    if (productPhoto) {
      formData.append('photo', productPhoto);
    }

    await api.updateProduct(editProduct.id, formData);
    setEditProduct(null);
    setProductPhoto(null);
    fetchData();
  };


  const handleAddItem = async (e) => {
    e.preventDefault();
    await api.addTableItem(activeTable.id, addItemData);
    setAddItemData({ product_id: '', quantity: 1 });
    setActiveTable(null);
    fetchData();
  };

  const handleCloseTable = async (paymentMethod) => {
    await api.closeTable(checkoutTable.id, paymentMethod);
    setCheckoutTable(null);
    fetchData();
  };

  const filterTablesByPeriod = (tablesList) => {
    if (periodFilter === 'tudo') return tablesList;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return tablesList.filter(t => {
      const createdAt = new Date(t.created_at).getTime();
      if (periodFilter === 'hoje') return createdAt >= today;
      if (periodFilter === 'semana') return createdAt >= today - 7 * 24 * 60 * 60 * 1000;
      if (periodFilter === 'mes') return createdAt >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
      return true;
    });
  };

  const filteredPeriodTables = filterTablesByPeriod(tables);

  const totalRevenue = filteredPeriodTables
    .filter(t => t.status === 'closed')
    .reduce((acc, t) => acc + parseFloat(t.total || 0), 0);
  const openTablesCount = filteredPeriodTables.filter(t => t.status === 'open').length;
  const closedTablesCount = filteredPeriodTables.filter(t => t.status === 'closed').length;

  const displayTables = filteredPeriodTables.filter(t => {
    if (tableFilter === 'open') return t.status === 'open';
    if (tableFilter === 'closed') return t.status === 'closed';
    return true;
  });

  const bestSellers = useMemo(() => {
    const counts = {};
    filteredPeriodTables.filter(t => t.status === 'closed').forEach(t => {
      t.items?.forEach(item => {
        const name = item.product?.name || 'Item Removido';
        if (!counts[name]) counts[name] = { name, quantity: 0, total: 0 };
        counts[name].quantity += item.quantity;
        counts[name].total += parseFloat(item.total_price || 0);
      });
    });
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [filteredPeriodTables]);

  if (isMenuPage) {
    const productsByCategory = {};
    products.forEach(p => {
      const catName = p.category_name || 'Outros';
      if (!productsByCategory[catName]) productsByCategory[catName] = [];
      productsByCategory[catName].push(p);
    });

    return (
      <div className="min-h-screen bg-[#fcfaf2] text-[#4a3b32] pb-10 font-sans">
        <header className="py-8 px-4 flex flex-col items-center border-b-2 border-dotted border-[#82b4a7] mb-6">
          <h1 className="text-4xl font-black text-[#82b4a7] tracking-wider uppercase drop-shadow-sm mb-2" style={{ fontFamily: 'Georgia, serif' }}>Comanda Digital</h1>
          <p className="text-[#c4a2c8] font-bold text-sm tracking-[0.2em] text-center">BOM ESPETINHO ♥ BOAS AMIGAS ♥ BONS MOMENTOS</p>
        </header>
        <main className="max-w-3xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {Object.entries(productsByCategory).map(([catName, items]) => (
            <div key={catName}>
              <div className="bg-[#82b4a7] text-[#fcfaf2] px-4 py-2 font-bold text-lg mb-4 inline-block rounded-r-full shadow-sm shadow-[#82b4a7]/50 uppercase tracking-widest">
                {catName}
              </div>
              <ul className="flex flex-col gap-3">
                {items.map(item => (
                  <li key={item.id} className="flex justify-between items-end border-b border-dotted border-[#c4a2c8] pb-1">
                    <span className="font-bold text-[#4a3b32] uppercase text-sm pr-4">{item.name}</span>
                    <span className="font-black text-[#c4a2c8] whitespace-nowrap">R$ {item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </main>
        <footer className="mt-12 pt-6 border-t-2 border-dotted border-[#82b4a7] text-center">
          <p className="text-[#82b4a7] font-black text-xl tracking-widest uppercase mb-4">Aqui é Delas!</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm font-bold text-[#4a3b32] bg-white mx-4 p-4 rounded-xl shadow-sm border border-[#82b4a7]/20">
            <span className="flex items-center justify-center gap-2">🟢 (81) 99514-4347</span>
            <span className="flex items-center justify-center gap-2">💠 Pague com PIX</span>
            <span className="flex items-center justify-center gap-2">🟣 @espetinhodelas</span>
          </div>
        </footer>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
          <h1 className="text-2xl font-black text-center text-blue-600 mb-6">Comanda Digital</h1>
          <h2 className="text-lg font-bold mb-4 text-center text-gray-700">Fazer Login</h2>

          {authError && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center font-medium">{authError}</div>}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input
              className="border p-3 rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Usuário"
              value={authForm.username}
              onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
              required
            />
            <input
              className="border p-3 rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              type="password"
              placeholder="Senha"
              value={authForm.password}
              onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              required
            />
            <button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded shadow-md hover:bg-blue-700 transition-colors">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <nav className="bg-[#82b4a7] text-white p-4 shadow-md sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', letterSpacing: '2px' }}>COMANDA DIGITAL</h1>
        <div className="flex flex-wrap justify-center items-center gap-2">
          <button
            className={`px-3 py-1 rounded text-sm font-bold ${view === 'tables' ? 'bg-[#4a3b32]' : 'bg-[#639386] hover:bg-[#4a3b32]'}`}
            onClick={() => setView('tables')}
          >
            Mesas
          </button>
          {currentUser?.is_admin && (
            <>
              <button
                className={`px-3 py-1 rounded text-sm font-bold ${view === 'products' ? 'bg-[#4a3b32]' : 'bg-[#639386] hover:bg-[#4a3b32]'}`}
                onClick={() => setView('products')}
              >
                Produtos
              </button>
              <button
                className={`px-3 py-1 rounded text-sm font-bold ${view === 'users' ? 'bg-[#4a3b32]' : 'bg-[#639386] hover:bg-[#4a3b32]'}`}
                onClick={() => setView('users')}
              >
                Atendentes
              </button>
            </>
          )}
          <button onClick={logout} className="px-3 py-1 rounded text-sm bg-red-500 hover:bg-red-600 ml-2 font-semibold">
            Sair
          </button>
        </div>
      </nav>

      <main className="p-4 max-w-5xl mx-auto">
        {view === 'tables' && (
          <div>
            {currentUser?.is_admin && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div
                    className={`bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 flex flex-col justify-center cursor-pointer transition-all ${tableFilter === 'open' ? 'bg-blue-50 ring-2 ring-blue-300 transform scale-[1.02]' : 'hover:bg-gray-50'}`}
                    onClick={() => setTableFilter(tableFilter === 'open' ? 'all' : 'open')}
                  >
                    <span className="text-gray-500 text-sm font-semibold">Mesas Abertas</span>
                    <span className="text-2xl font-black text-blue-600">{openTablesCount}</span>
                  </div>
                  <div
                    className={`bg-white p-4 rounded-lg shadow border-l-4 border-gray-400 flex flex-col justify-center cursor-pointer transition-all ${tableFilter === 'closed' ? 'bg-gray-100 ring-2 ring-gray-300 transform scale-[1.02]' : 'hover:bg-gray-50'}`}
                    onClick={() => setTableFilter(tableFilter === 'closed' ? 'all' : 'closed')}
                  >
                    <span className="text-gray-500 text-sm font-semibold">Mesas Fechadas</span>
                    <span className="text-2xl font-black text-gray-700">{closedTablesCount}</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 flex flex-col justify-center relative">
                    <span className="text-gray-500 text-sm font-semibold">Faturamento</span>
                    <span className="text-2xl font-black text-green-600">R$ {totalRevenue.toFixed(2)}</span>

                    <select
                      className="absolute top-2 right-2 text-xs border border-gray-200 rounded p-1 bg-white text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                      value={periodFilter}
                      onChange={(e) => setPeriodFilter(e.target.value)}
                    >
                      <option value="hoje">Hoje</option>
                      <option value="semana">Esta Semana</option>
                      <option value="mes">Este Mês</option>
                      <option value="tudo">Todo o Período</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow mb-6">
                  <h2 className="text-lg font-bold mb-3 text-gray-700 flex items-center gap-2">
                    <span role="img" aria-label="chart">📊</span> Produtos Mais Vendidos
                  </h2>
                  {bestSellers.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum produto vendido neste período.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="py-2 text-sm text-gray-500 font-semibold">Produto</th>
                            <th className="py-2 text-sm text-gray-500 font-semibold text-right">Qtd Vendida</th>
                            <th className="py-2 text-sm text-gray-500 font-semibold text-right">Receita Bruta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bestSellers.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                              <td className="py-2 font-medium text-gray-800"><span className="text-gray-400 mr-2">{index + 1}º</span> {item.name}</td>
                              <td className="py-2 text-right font-bold text-blue-600">{item.quantity} un</td>
                              <td className="py-2 text-right font-semibold text-green-600">R$ {item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="bg-white p-4 rounded-lg shadow mb-6 relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <h2 className="text-lg font-semibold">Abrir Nova Mesa</h2>
                <button
                  onClick={() => setShowQR(true)}
                  className="bg-[#c4a2c8] text-white px-3 py-1 text-sm rounded font-bold hover:bg-purple-400 shadow-md flex gap-2 items-center"
                >
                  <span role="img" aria-label="qr">📱</span> QR Code do Cardápio
                </button>
              </div>
              <form onSubmit={handleCreateTable} className="flex flex-col sm:flex-row gap-3">
                <input
                  className="border p-2 rounded flex-1"
                  placeholder="Nome do Cliente"
                  value={newTable.customer_name}
                  onChange={e => setNewTable({ ...newTable, customer_name: e.target.value })}
                  required
                />
                <input
                  className="border p-2 rounded flex-1"
                  type="number"
                  placeholder="Número da Mesa"
                  value={newTable.table_number}
                  onChange={e => setNewTable({ ...newTable, table_number: e.target.value })}
                  required
                />
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600 transition-colors">
                  Abrir Mesa
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayTables.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">Nenhuma mesa encontrada neste período/filtro.</p>}
              {displayTables.map(table => (
                <div key={table.id} className={`p-4 rounded-lg shadow border-l-4 ${table.status === 'open' ? 'bg-white border-blue-500 cursor-pointer hover:bg-gray-50' : 'bg-gray-200 border-gray-400 cursor-pointer hover:bg-gray-300'} transition-colors`} onClick={() => setViewTable(table)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">Mesa {table.table_number}</h3>
                      <p className="text-sm text-gray-600">{table.customer_name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${table.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-300 text-gray-700'}`}>
                      {table.status === 'open' ? 'Aberta' : 'Fechada'}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 mb-3">
                    <p>Total: <span className="font-bold text-lg text-green-700">R$ {table.total}</span></p>
                    <p className="text-xs text-gray-500">{table.items?.length || 0} itens consumidos</p>
                  </div>

                  {table.status === 'open' && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveTable(table); }}
                        className="flex-1 bg-blue-100 text-blue-700 py-2 rounded text-sm font-semibold hover:bg-blue-200 transition-colors"
                      >
                        + Adicionar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCheckoutTable(table); setCheckoutPayment(''); }}
                        className="flex-1 bg-red-100 text-red-700 py-2 rounded text-sm font-semibold hover:bg-red-200 transition-colors"
                      >
                        Fechar Conta
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'products' && (
          <div>
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-3">Gerenciar Categorias</h2>
              <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-3">
                <input
                  className="border p-2 rounded flex-1"
                  placeholder="Nome da Nova Categoria"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  required
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700 transition-colors">
                  Criar Categoria
                </button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-3">Cadastrar Novo Produto</h2>
              <form onSubmit={handleCreateProduct} className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <input
                  className="border p-2 rounded flex-1 min-w-[150px]"
                  placeholder="Nome do Produto"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
                <input
                  className="border p-2 rounded w-full sm:w-24"
                  type="number"
                  step="0.01"
                  placeholder="Preço R$"
                  value={newProduct.price}
                  onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
                <input
                  className="border p-2 rounded w-full sm:w-24"
                  type="number"
                  placeholder="Estoque"
                  value={newProduct.stock_quantity}
                  onChange={e => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                  required
                />
                <select
                  className="border p-2 rounded w-full sm:w-auto"
                  value={newProduct.category}
                  onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                >
                  <option value="">Sem Categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  className="border p-1 rounded w-full sm:w-auto text-sm"
                  type="file"
                  accept="image/*"
                  onChange={e => setProductPhoto(e.target.files[0])}
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-colors">
                  Cadastrar
                </button>
              </form>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h2 className="text-xl font-bold">Estoque de Produtos</h2>
              <select
                className="border border-gray-300 p-2 rounded bg-white shadow-sm font-semibold text-sm outline-none focus:ring-2 focus:ring-[#82b4a7]"
                value={productCategoryFilter}
                onChange={e => setProductCategoryFilter(e.target.value)}
              >
                <option value="all">Todas as Categorias</option>
                {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">Nenhum produto cadastrado.</p>}
              {products
                .filter(p => productCategoryFilter === 'all' || p.category?.toString() === productCategoryFilter)
                .map(product => {
                  const isOutOfStock = product.stock_quantity <= 0;
                  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

                  return (
                    <div key={product.id} className={`bg-white p-3 rounded shadow text-center flex flex-col h-full relative border-2 ${isOutOfStock ? 'border-red-500 opacity-75' : isLowStock ? 'border-orange-400' : 'border-transparent'}`}>
                      {isOutOfStock && <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full z-10 shadow">ESGOTADO</div>}
                      {isLowStock && <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-full z-10 shadow animate-pulse">ACABANDO</div>}

                      {product.photo ? (
                        <img src={product.photo} alt={product.name} className="w-full h-24 object-cover rounded mb-2" />
                      ) : (
                        <div className="w-full h-24 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400 text-xs">Sem Foto</div>
                      )}
                      <div className="flex-1 mt-2">
                        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                        {product.category_name && <span className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded mt-1 mb-1">{product.category_name}</span>}
                        <p className="text-green-600 font-bold">R$ {product.price}</p>
                        <p className={`text-xs mt-1 mb-2 font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-gray-500'}`}>Estoque: {product.stock_quantity}</p>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <button onClick={() => { setEditProduct(product); setProductPhoto(null); }} className="flex-1 bg-yellow-100 text-yellow-700 py-1 rounded text-xs font-semibold hover:bg-yellow-200 transition-colors">Editar</button>
                        <button onClick={() => setProductToDelete(product)} className="flex-1 bg-red-100 text-red-700 py-1 rounded text-xs font-semibold hover:bg-red-200 transition-colors">Excluir</button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {view === 'users' && currentUser?.is_admin && (
          <div>
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-3">Criar Conta de Atendimento</h2>
              <p className="text-sm text-gray-600 mb-4">Esta conta terá acesso apenas à gestão de mesas (abrir, adicionar itens e fechar comanda).</p>
              <form onSubmit={handleRegisterUser} className="flex flex-col sm:flex-row gap-3">
                <input
                  className="border p-2 rounded flex-1"
                  placeholder="Novo Usuário"
                  value={authForm.username}
                  onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                  required
                />
                <input
                  className="border p-2 rounded flex-1"
                  type="password"
                  placeholder="Senha"
                  value={authForm.password}
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700 transition-colors">
                  Criar Conta
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      {activeTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm shadow-2xl scale-100 transition-transform">
            <h2 className="text-lg font-bold mb-4 text-center">Adicionar à Mesa {activeTable.table_number}</h2>
            <form onSubmit={handleAddItem} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Produto</label>
                <input
                  type="text"
                  placeholder="Buscar produto pelo nome..."
                  className="border border-gray-300 p-2 rounded w-full bg-white mb-2"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
                <select
                  className="border border-gray-300 p-2 rounded w-full bg-gray-50"
                  value={addItemData.product_id}
                  onChange={e => setAddItemData({ ...addItemData, product_id: e.target.value })}
                  required
                >
                  <option value="">Selecione o produto...</option>
                  {products
                    .filter(p => p.stock_quantity > 0)
                    .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name} - R$ {p.price} (Estoque: {p.stock_quantity})</option>
                    ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Quantidade</label>
                <input
                  className="border border-gray-300 p-2 rounded w-full bg-gray-50"
                  type="number"
                  min="1"
                  placeholder="Ex: 2"
                  value={addItemData.quantity}
                  onChange={e => setAddItemData({ ...addItemData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setActiveTable(null)} className="flex-1 bg-gray-200 py-3 rounded font-semibold text-gray-700 hover:bg-gray-300 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-500 py-3 rounded font-semibold text-white hover:bg-blue-600 transition-colors shadow-md">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
            <h2 className="text-xl font-bold mb-1 text-center">Resumo da Conta</h2>
            <p className="text-gray-600 mb-4 text-center">Mesa {checkoutTable.table_number} - {checkoutTable.customer_name}</p>

            <div className="overflow-y-auto flex-1 mb-4 border-t border-b py-3">
              {checkoutTable.items?.length === 0 && <p className="text-center text-sm text-gray-500">Nenhum item consumido.</p>}
              {checkoutTable.items?.map(item => (
                <div key={item.id} className="flex justify-between py-2 border-b last:border-0 border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded text-xs">{item.quantity}x</span>
                    <span className="text-sm font-medium">{item.product.name}</span>
                  </div>
                  <span className="font-semibold text-gray-700">R$ {item.total_price}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-6 bg-gray-50 p-3 rounded">
              <span className="text-lg font-bold text-gray-700">Total a Pagar:</span>
              <span className="text-2xl font-black text-green-600">R$ {checkoutTable.total}</span>
            </div>

            <p className="text-sm font-semibold text-gray-600 mb-2 text-center">Selecione a Forma de Pagamento:</p>
            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex gap-2">
                <button onClick={() => setCheckoutPayment('pix')} className={`flex-1 py-3 rounded font-bold shadow-md transition-colors ${checkoutPayment === 'pix' ? 'bg-teal-600 text-white ring-4 ring-teal-300' : 'bg-teal-500 text-white hover:bg-teal-600'}`}>PIX</button>
                <button onClick={() => setCheckoutPayment('cartao')} className={`flex-1 py-3 rounded font-bold shadow-md transition-colors ${checkoutPayment === 'cartao' ? 'bg-indigo-600 text-white ring-4 ring-indigo-300' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}>Cartão</button>
                <button onClick={() => setCheckoutPayment('dinheiro')} className={`flex-1 py-3 rounded font-bold shadow-md transition-colors ${checkoutPayment === 'dinheiro' ? 'bg-green-700 text-white ring-4 ring-green-300' : 'bg-green-600 text-white hover:bg-green-700'}`}>Dinheiro</button>
              </div>

              <button
                onClick={() => handleCloseTable(checkoutPayment)}
                disabled={!checkoutPayment}
                className={`w-full py-3 rounded font-bold mt-2 transition-colors shadow-md ${checkoutPayment ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                Confirmar Pagamento
              </button>
              <button onClick={() => setCheckoutTable(null)} className="w-full border-2 border-gray-300 py-2 rounded font-bold text-gray-600 hover:bg-gray-100 transition-colors mt-2">Voltar</button>
            </div>
          </div>
        </div>
      )}

      {/* View Closed Table Modal */}
      {viewTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
            <h2 className="text-xl font-bold mb-1 text-center flex-1">Detalhes da Comanda</h2>
            <p className="text-gray-600 mb-2 text-center">Mesa {viewTable.table_number} - {viewTable.customer_name}</p>

            <div className="bg-gray-100 p-2 rounded text-center mb-4 text-sm font-semibold text-gray-700">
              Status: <span className={viewTable.status === 'open' ? 'text-blue-600 uppercase' : 'text-gray-600 uppercase'}>{viewTable.status === 'open' ? 'Aberta' : 'Fechada'}</span> <br />
              {viewTable.status === 'closed' && <>Pagamento: <span className="uppercase text-blue-600">{viewTable.payment_method || 'Não Registrado'}</span></>}
            </div>

            <div className="overflow-y-auto flex-1 mb-4 border-t border-b py-3">
              {viewTable.items?.length === 0 && <p className="text-center text-sm text-gray-500">Nenhum item consumido.</p>}
              {viewTable.items?.map(item => (
                <div key={item.id} className="flex justify-between py-2 border-b last:border-0 border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded text-xs">{item.quantity}x</span>
                    <span className="text-sm font-medium">{item.product?.name || 'Item Removido'}</span>
                  </div>
                  <span className="font-semibold text-gray-700">R$ {item.total_price}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-6 bg-gray-50 p-3 rounded">
              <span className="text-lg font-bold text-gray-700">Total Pago:</span>
              <span className="text-2xl font-black text-gray-800">R$ {viewTable.total}</span>
            </div>

            <div className="flex mt-auto">
              <button onClick={() => setViewTable(null)} className="w-full border-2 border-gray-300 py-3 rounded font-bold text-gray-600 hover:bg-gray-100 transition-colors">Fechar Detalhes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm shadow-2xl scale-100 transition-transform">
            <h2 className="text-lg font-bold mb-4 text-center">Editar Produto</h2>
            <form onSubmit={handleUpdateProduct} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Nome</label>
                <input
                  className="border border-gray-300 p-2 rounded w-full bg-gray-50"
                  value={editProduct.name}
                  onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Preço R$</label>
                <input
                  className="border border-gray-300 p-2 rounded w-full bg-gray-50"
                  type="number"
                  step="0.01"
                  value={editProduct.price}
                  onChange={e => setEditProduct({ ...editProduct, price: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Quantidade em Estoque</label>
                <input
                  className="border border-gray-300 p-2 rounded w-full bg-gray-50"
                  type="number"
                  value={editProduct.stock_quantity}
                  onChange={e => setEditProduct({ ...editProduct, stock_quantity: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Categoria</label>
                <select
                  className="border border-gray-300 p-2 rounded w-full bg-gray-50"
                  value={editProduct.category || ''}
                  onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                >
                  <option value="">Sem Categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Nova Foto (Opcional)</label>
                <input
                  className="border p-1 rounded w-full text-sm"
                  type="file"
                  accept="image/*"
                  onChange={e => setProductPhoto(e.target.files[0])}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setEditProduct(null)} className="flex-1 bg-gray-200 py-3 rounded font-semibold text-gray-700 hover:bg-gray-300 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-yellow-500 py-3 rounded font-semibold text-white hover:bg-yellow-600 transition-colors shadow-md">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm shadow-2xl scale-100 transition-transform text-center">
            <h2 className="text-lg font-bold mb-2">Confirmar Exclusão</h2>
            <p className="text-gray-600 mb-6">Tem certeza que deseja excluir o produto <strong>{productToDelete.name}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => setProductToDelete(null)} className="flex-1 bg-gray-200 py-3 rounded font-semibold text-gray-700 hover:bg-gray-300 transition-colors">Cancelar</button>
              <button onClick={async () => {
                await api.deleteProduct(productToDelete.id);
                setProductToDelete(null);
                fetchData();
              }} className="flex-1 bg-red-500 py-3 rounded font-semibold text-white hover:bg-red-600 transition-colors shadow-md">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-[#82b4a7] mb-2 font-serif uppercase tracking-widest">Cardápio Digital</h2>
            <p className="text-gray-600 text-sm mb-6">Escaneie o código abaixo para ver o menu no seu celular, ou clique para abrir.</p>

            <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-[#c4a2c8] inline-block mb-6 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => window.open('/cardapio', '_blank')}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/cardapio')}`}
                alt="QR Code Cardápio"
                className="w-48 h-48 mx-auto mix-blend-multiply"
              />
            </div>

            <button onClick={() => setShowQR(false)} className="w-full bg-[#4a3b32] text-white py-3 rounded-lg font-bold hover:bg-[#6a5549] transition-colors shadow-md">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
