import React from 'react'
import Home from "./pages/Home.jsx"
import Editor from "./pages/Editor.jsx"
import { createBrowserRouter, createRoutesFromElements, Route} from 'react-router-dom';

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
        <Route path = "/" element={<Home/>}/>
        <Route path = "/editor" element={<Editor/>}/>
        </>
    )
) 

export default router