import React, { useState } from "react";
import {
  IconUser,
  IconKey,
  IconEye,
  IconEyeOff,
} from "../components/MainIcons.jsx";
import TerraTechPacks from "../assets/TerraTechPacks.png";
import { Link } from "react-router-dom";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 1. Create the submit handler function
  const handleSubmit = (e) => {
    e.preventDefault(); // <--- This stops the page reload
    console.log("Login attempt:", { username, password });
    // Add your API call or authentication logic here
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans">
      {/* --- LEFT SECTION (Form) --- */}
      <div className="w-[50vw] relative flex flex-col items-center justify-center">
        {/* Decorative Circle: Top Right (Blue) */}
        <div className="absolute -top-[6vw] right-[2vw] w-[12vw] h-[12vw] bg-[#1e73be] rounded-full"></div>

        {/* Decorative Circle: Bottom Left (Dark Blue) */}
        <div className="absolute -bottom-[6vw] -left-[2vw] w-[14vw] h-[14vw] bg-[#263895] rounded-full"></div>

        {/* Login Container */}
        <div className="w-[28vw] z-10 text-center">
          <h1 className="text-[2.5vw] font-bold text-black mb-[1.5vw]">
            LOGIN
          </h1>

          <p className="text-[0.9vw] font-medium text-gray-800 mb-[2.5vw]">
            Hey Terra Tech Packs Team ,{" "}
            <span className="text-[#00b5e2] font-bold">Welcome Back !</span>
          </p>

          {/* 2. Attach the handler to the form tag */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[1.2vw] w-full">
            {/* Username Input */}
            <div className="relative group">
                <div className="absolute left-[1vw] top-1/2 -translate-y-1/2 p-[0.4vw] bg-white rounded-full shadow-sm">
                    <IconUser className="w-[1vw] h-[1vw] text-[#263895]" />
                </div>
                <input
                type="text"
                placeholder="User Name"
                className="w-full pl-[3.5vw] pr-[1.5vw] py-[1vw] bg-gray-100 border-2 font-medium border-transparent rounded-[0.8vw] text-[1vw] text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#263895]/20 focus:outline-none transition-all duration-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                />
            </div>

            {/* Password Input */}
            <div className="relative group">
                <div className="absolute left-[1vw] top-1/2 -translate-y-1/2 p-[0.4vw] bg-white rounded-full shadow-sm">
                    <IconKey className="w-[1vw] h-[1vw] text-[#263895]" />
                </div>
                <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full pl-[3.5vw] pr-[3vw] py-[1vw] bg-gray-100 border-2 border-transparent rounded-[0.8vw] text-[1vw] font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#263895]/20 focus:outline-none transition-all duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
                <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-[1.2vw] cursor-pointer top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#263895] transition-colors"
                >
                {showPassword ? (
                    <IconEye className="w-[1.2vw] h-[1.2vw]" />
                ) : (
                    <IconEyeOff className="w-[1.2vw] h-[1.2vw]" />
                )}
                </button>
            </div>

            {/* Submit Button - Full Width with Gradient */}
            <div className="mt-[1vw]">
              <Link to='/'>
                <button
                type="submit"
                className="w-full cursor-pointer bg-gradient-to-r from-[#263895] to-[#2485b8] text-white text-[1vw] font-semibold py-[1vw] rounded-[0.8vw] shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                Login
                </button>
              </Link>
            </div>
            </form>
        </div>
      </div>

      {/* --- RIGHT SECTION (Brand & Pattern) --- */}
      <div className="w-[50vw] relative bg-gradient-to-br from-[#263895] to-[#2485b8] flex items-center justify-center overflow-hidden">
        {/* Background Pattern (Wave/Ripples) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] border-[0.2vw] border-white/5 rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[55vw] border-[0.2vw] border-white/5 rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] border-[0.2vw] border-white/5 rounded-full pointer-events-none"></div>
        <div className="absolute top-[10%] left-[80%] w-[30vw] h-[30vw] border-[0.2vw] border-white/10 rounded-full pointer-events-none blur-sm"></div>
        <div className="absolute bottom-[10%] right-[80%] w-[40vw] h-[40vw] border-[0.2vw] border-white/5 rounded-full pointer-events-none"></div>

        {/* Logo Container */}
        <div className="z-10">
          <img
            src={TerraTechPacks}
            alt="TerraTech Packs Logo"
            className="w-[27vw] "
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;