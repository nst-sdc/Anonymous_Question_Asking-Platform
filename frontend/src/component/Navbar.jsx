import { LuSquareMenu } from "react-icons/lu";
import {useState} from 'react';
const Navbar = () => {
    const [ showMenu , setShowMenu] = useState(false); 
    const handleButtonToggle = () => {
        setShowMenu(!showMenu)
    } 
  return (
    <header>
      <div className="container">
        <div className="grid navbar-grid">
          <div className="logo">
            <h1>BRAND NAME</h1>
          </div>
          <nav className={showMenu ? "mobile_menu" : "web_menu" }>
            <ul>
              <li>
                <a href="#" target="_blank">Home</a>
              </li>
              <li>
                <a href="#" target="_blank">About</a>
              </li>
              <li>
                <a href="#" target="_blank">Join Room</a>
              </li>
              <li>
                <a href="#" target="_blank">Contact</a>
              </li>
            </ul>
          </nav>
          <div className="menu">
            <button onClick={handleButtonToggle}><LuSquareMenu /></button>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
