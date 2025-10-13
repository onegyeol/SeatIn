import Link from "next/link";
import { useRouter} from "next/router"

const logoStyle = {
  textDecoration: "none",
  fontSize: "2.3rem",
  fontWeight: "900",
  color: "#1e40af", 
  fontFamily: "Giants-Bold",
};

const spanStyle = {
  color: "#f97316", 
};

export default function Logo() {
  const router = useRouter();

  const handleClick = (e) => {
    e.preventDefault();
    if (router.pathname === "/home") {
      router.reload(); 
    } else {
      router.push("/home"); 
    }
  };

  return (
    <a href="/home" onClick={handleClick} style={logoStyle}>
      Seat<span style={spanStyle}>In</span>
    </a>
  );
}