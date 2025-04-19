import { HomeIcon, UserCircleIcon, LightBulbIcon, BellAlertIcon } from "@heroicons/react/24/solid"

export default function BottomMenu(){
    return(
        <div className="fixed bottom-0 bg-gradient-to-tl from-gray-900 via-teal-950 to-gray-800 py-2 flex items-center w-full z-50 justify-around">
            <div className="flex flex-col items-center justify-center">
                <HomeIcon className="w-6 h-6"/>
                <p className="text-xs text-center font-semibold mt-2">Home</p>
            </div>
            <div className="flex flex-col items-center justify-center">
                <UserCircleIcon className="w-6 h-6"/>   
                <p className="text-xs text-center font-semibold mt-2">Account</p>
            </div>
            <div className="flex flex-col items-center justify-center">
                <BellAlertIcon className="w-6 h-6"/>
                <p className="text-xs text-center font-semibold mt-2">Notifications</p>
            </div>
            <div className="flex flex-col items-center justify-center">
                <LightBulbIcon className="w-6 h-6"/>
                <p className="text-xs text-center font-semibold mt-2">AI</p>
            </div>
        </div>
    )
}