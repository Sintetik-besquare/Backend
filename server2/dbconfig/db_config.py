# from fileinput import close
# import psycopg2
# import os
# coonnection= None
# cursor= None

# try:
#     connection = psycopg2.connect(
#         host='localhost',
#         port=5432,
#         user='postgres',
#         password= 'postgres',
#         dbname= 'sintetik'
#     )
#     cursor=connection.cursor()
    
#     script = ''''''
#     values = ()
#     connection.close()
 
# except Exception as error:
#     print(error)

# finally:
#     if cursor is not None:
#         cursor.close()
#     if connection is not None:
#         connection.close()