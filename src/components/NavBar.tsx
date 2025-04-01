const NavBar = () => {

    return (
        <div>
            <li className="flex justify-center text-white gap-5 mt-[25px]">
                <ul className="bg-blue-950 p-1 rounded-lg hover:bg-white hover:text-black">Tree</ul>
                <ul className="bg-blue-950 p-1 rounded-lg hover:bg-white hover:text-black">Hash</ul>
                <ul className="bg-blue-950 p-1 rounded-lg hover:bg-white hover:text-black">LinkedList</ul>
            </li>
        </div>
    )
}

export default NavBar;