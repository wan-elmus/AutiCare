export default function Spinner({full}){
    return(
        <div className={`flex items-center justify-center ${full?'w-[100vw] h-[90vh] bg-white flex-col absolute top-0 z-50':'w-full h-full'} bg-primary-dark`}>
            {
                full && <div className='icon-[eos-icons--three-dots-loading] text-primary w-14 h-14'/>
            }
            {
                !full && <div className="icon-[line-md--loading-alt-loop] w-24 h-24 text-primary"/>
            }
        </div>
    )
}