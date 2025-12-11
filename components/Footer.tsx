
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black/40 backdrop-blur-sm text-gray-300 pt-10 pb-6 mt-8 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top Section: Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1 */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Radio Escola Joana</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Imprensa</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Ajuda</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Fale Conosco</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Suporte</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Termos</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos e Condições</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div>
            <p className="font-medium text-white">Desenvolvido por: <span className="font-bold">André Brito</span></p>
            <p className="text-xs text-gray-400 mt-1">Versão: 1.2</p>
          </div>
          
          <div className="space-y-1 text-sm">
             <p>Contato: <a href="mailto:britodeandrade@gmail.com" className="hover:text-white transition-colors">britodeandrade@gmail.com</a></p>
             <p>+55 21 994 527 694</p>
          </div>

          <div className="text-xs text-gray-500">
            &copy; 2025 Radio Escola Joana Inc.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
